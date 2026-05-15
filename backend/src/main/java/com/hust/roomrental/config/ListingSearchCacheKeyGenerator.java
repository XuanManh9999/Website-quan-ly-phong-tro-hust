package com.hust.roomrental.config;

import org.springframework.cache.interceptor.KeyGenerator;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.util.Arrays;

@Component("listingSearchCacheKeyGenerator")
public class ListingSearchCacheKeyGenerator implements KeyGenerator {

    @Override
    public Object generate(Object target, Method method, Object... params) {
        if (params == null || params.length < 10 || !(params[9] instanceof Pageable p)) {
            return "listingSearch:" + Arrays.deepHashCode(params);
        }
        return String.join("|",
                String.valueOf(params[0]),
                String.valueOf(params[1]),
                String.valueOf(params[2]),
                String.valueOf(params[3]),
                String.valueOf(params[4]),
                String.valueOf(params[5]),
                String.valueOf(params[6]),
                String.valueOf(params[7]),
                String.valueOf(params[8]),
                String.valueOf(p.getPageNumber()),
                String.valueOf(p.getPageSize()),
                String.valueOf(p.getSort())
        );
    }
}
