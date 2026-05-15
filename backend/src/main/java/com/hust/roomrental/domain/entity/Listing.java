package com.hust.roomrental.domain.entity;

import com.hust.roomrental.domain.enums.ListingStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.BatchSize;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "listings", indexes = {
        @Index(columnList = "owner_id"),
        @Index(columnList = "status"),
        @Index(columnList = "district")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Listing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    // Ép kiểu rõ ràng để PostgreSQL không tạo nhầm bytea khi recreate DB.
    @Column(nullable = false, length = 255, columnDefinition = "varchar(255)")
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 14, scale = 0)
    private BigDecimal price;

    @Column(name = "area_m2")
    private Double areaM2;

    @Column(nullable = false, length = 500, columnDefinition = "varchar(500)")
    private String address;

    @Column(length = 120, columnDefinition = "varchar(120)")
    private String district;

    private Double latitude;
    private Double longitude;

    @Column(name = "max_occupants")
    private Integer maxOccupants;

    /** male | female | any */
    @Column(name = "gender_policy", length = 16, columnDefinition = "varchar(16)")
    private String genderPolicy;

    @Column(precision = 14, scale = 0)
    private BigDecimal deposit;

    @Column(name = "map_embed_html", columnDefinition = "TEXT")
    private String mapEmbedHtml;

    /** JSON string for utilities; store as text for portability. */
    @Column(name = "utilities_json", columnDefinition = "TEXT")
    private String utilitiesJson;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ListingStatus status;

    @Column(name = "room_available", nullable = false)
    private boolean roomAvailable = true;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "published_at")
    private Instant publishedAt;

    @Column(name = "view_count", nullable = false)
    private long viewCount;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "listing", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 32)
    @Builder.Default
    private List<ListingImage> images = new ArrayList<>();

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
