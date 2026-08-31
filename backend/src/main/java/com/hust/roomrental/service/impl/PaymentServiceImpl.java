package com.hust.roomrental.service.impl;

import com.hust.roomrental.config.AppProperties;
import com.hust.roomrental.domain.entity.PaymentOrder;
import com.hust.roomrental.domain.entity.User;
import com.hust.roomrental.domain.enums.PaymentOrderStatus;
import com.hust.roomrental.domain.enums.UserRole;
import com.hust.roomrental.dto.payment.CreatePaymentResponse;
import com.hust.roomrental.exception.ApiException;
import com.hust.roomrental.integration.vnpay.VnPaySignatureVerifier;
import com.hust.roomrental.repository.PaymentOrderRepository;
import com.hust.roomrental.repository.SubscriptionPackageRepository;
import com.hust.roomrental.repository.UserRepository;
import com.hust.roomrental.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentOrderRepository paymentOrderRepository;
    private final SubscriptionPackageRepository subscriptionPackageRepository;
    private final UserRepository userRepository;
    private final AppProperties appProperties;
    private final VnPaySignatureVerifier vnPaySignatureVerifier;

    @Override
    @Transactional
    public CreatePaymentResponse createPayment(User user, String packageCode) {
        if (user.getRole() != UserRole.LANDLORD && user.getRole() != UserRole.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "NOT_LANDLORD", "Chỉ chủ trọ mua gói");
        }
        var pkg = subscriptionPackageRepository.findByCodeAndActiveIsTrue(packageCode)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "PACKAGE_NOT_FOUND", "Không tìm thấy gói"));
        String txnRef = "HUST" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 8);
        PaymentOrder order = PaymentOrder.builder()
                .user(user)
                .subscriptionPackage(pkg)
                .amountVnd(pkg.getPriceVnd())
                .originalAmountVnd(pkg.getPriceVnd())
                .discountAmountVnd(BigDecimal.ZERO)
                .status(PaymentOrderStatus.PENDING)
                .vnpTxnRef(txnRef)
                .build();
        order = paymentOrderRepository.save(order);
        String paymentUrl = vnPaySignatureVerifier.buildPaymentUrl(
                order.getVnpTxnRef(),
                order.getAmountVnd().longValue(),
                "Thanh toan goi " + pkg.getName(),
                "127.0.0.1",
                appProperties.getVnpay().getReturnUrl()
        );
        return new CreatePaymentResponse(order.getId(), paymentUrl, txnRef);
    }

    @Override
    @Transactional
    public String handleIpn(Map<String, String> params) {
        if (!vnPaySignatureVerifier.verifyIpn(params)) {
            return "97";
        }
        String txnRef = params.get("vnp_TxnRef");
        String code = params.get("vnp_ResponseCode");
        String amountStr = params.get("vnp_Amount");
        if (txnRef == null) {
            return "01";
        }
        PaymentOrder order = paymentOrderRepository.findByVnpTxnRef(txnRef).orElse(null);
        if (order == null) {
            return "01";
        }
        if (order.getStatus() == PaymentOrderStatus.PAID) {
            return "02";
        }
        if (amountStr != null) {
            try {
                long amount = Long.parseLong(amountStr);
                long expected = order.getAmountVnd()
                        .multiply(java.math.BigDecimal.valueOf(100))
                        .longValue();
                if (!Objects.equals(amount, expected)) {
                    order.setRawIpnPayload(params.toString());
                    order.setStatus(PaymentOrderStatus.FAILED);
                    return "04";
                }
            } catch (NumberFormatException e) {
                order.setRawIpnPayload(params.toString());
                order.setStatus(PaymentOrderStatus.FAILED);
                return "04";
            }
        }
        if ("00".equals(code)) {
            markPaid(order, params.getOrDefault("vnp_TransactionNo", ""), params.toString());
        } else {
            order.setStatus(PaymentOrderStatus.FAILED);
            order.setRawIpnPayload(params.toString());
        }
        return "00";
    }

    @Override
    public boolean verifyReturnSignature(Map<String, String> params) {
        return vnPaySignatureVerifier.verifyIpn(params);
    }

    private void markPaid(PaymentOrder order, String vnpTxnNo, String raw) {
        order.setStatus(PaymentOrderStatus.PAID);
        order.setPaidAt(Instant.now());
        order.setVnpTransactionNo(vnpTxnNo);
        order.setRawIpnPayload(raw);
        paymentOrderRepository.save(order);

        User u = userRepository.findById(order.getUser().getId())
                .orElseThrow(() -> new IllegalStateException("user missing"));
        int extra = order.getSubscriptionPackage().getExtraListingsPerMonth();
        u.setBonusListingSlots(u.getBonusListingSlots() + extra);
        userRepository.save(u);
    }

}
