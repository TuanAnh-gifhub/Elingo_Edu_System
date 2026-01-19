package org.rent.room.be.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.util.List;
import java.util.UUID;
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@SuperBuilder
@Entity
@Table(name = "packages")
public class Package {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "package_id")
    private UUID packageId;

    @Column(name = "package_name", length = 50)
    private String packageName;

    private double price;

    @Column(name = "duration_days")
    private int durationDays;

    @OneToMany(mappedBy = "servicePackage", fetch = FetchType.LAZY)
    private List<Subscription> subscriptions;

    //servicePackage ten bien
    @OneToMany(mappedBy = "servicePackage", fetch = FetchType.LAZY)
    private List<Order> orders;
}
