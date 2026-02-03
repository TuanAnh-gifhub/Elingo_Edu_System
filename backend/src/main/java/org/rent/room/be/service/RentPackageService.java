package org.rent.room.be.service;

import org.rent.room.be.entity.RentPackage;

import java.util.List;
import java.util.UUID;

public interface RentPackageService {

    /**
     * Create a new RentPackage
     * @param pkg RentPackage entity to create
     * @return created RentPackage
     */
    RentPackage createRentPackage(RentPackage pkg);

    /**
     * Get a RentPackage by id
     * @param id RentPackage uuid
     * @return found RentPackage
     */
    RentPackage getRentPackageById(UUID id);

    /**
     * Get all RentPackages
     * @return list of RentPackages
     */
    List<RentPackage> getAllRentPackages();

    /**
     * Update existing RentPackage
     * @param id RentPackage id
     * @param pkg RentPackage data to update
     * @return updated RentPackage
     */
    RentPackage updateRentPackage(UUID id, RentPackage pkg);

    /**
     * Delete RentPackage by id
     * @param id RentPackage id
     */
    void deleteRentPackage(UUID id);
}
