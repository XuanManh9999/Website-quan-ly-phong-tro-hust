package com.hust.roomrental.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "article_tags", indexes = @Index(columnList = "slug", unique = true))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ArticleTag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(nullable = false, unique = true, length = 120)
    private String slug;
}
