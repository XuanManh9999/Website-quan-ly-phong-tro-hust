package com.hust.roomrental.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "article_categories", indexes = @Index(columnList = "slug", unique = true))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ArticleCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, unique = true, length = 160)
    private String slug;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private ArticleCategory parent;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;
}
