package org.rent.room.be.service.impl;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.rent.room.be.entity.RentPackage;
import org.rent.room.be.exception.AppException;
import org.rent.room.be.exception.ErrorCode;
import org.rent.room.be.repository.RentPackageRepository;
import org.rent.room.be.service.RentPackageService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class RentPackageServiceImpl implements RentPackageService {

    RentPackageRepository RentPackageRepository;

    @Override
    @Transactional
    public RentPackage createRentPackage(RentPackage pkg) {
        log.debug("Creating RentPackage: {}", pkg);
        if (pkg == null) throw new AppException(ErrorCode.INVALID_RENTPACKAGE);

        if (pkg.getRentPackageName() == null || pkg.getRentPackageName().trim().isEmpty()) {
            throw new AppException(ErrorCode.INVALID_RENTPACKAGE);
        }

        // price can be 0.0 meaning free RentPackage; validate negative values
        if (pkg.getPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new AppException(ErrorCode.INVALID_RENTPACKAGE);
        }
        if (pkg.getDurationDays() < 0) throw new AppException(ErrorCode.INVALID_RENTPACKAGE);

        RentPackage saved = RentPackageRepository.save(pkg);
        log.info("Created RentPackage with id={}", saved.getRentPackageId());
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public RentPackage getRentPackageById(UUID id) {
        Objects.requireNonNull(id, "id must not be null");
        return RentPackageRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RENTPACKAGE_NOT_FOUND));
    }

    @Override
    @Transactional(readOnly = true)
    public List<RentPackage> getAllRentPackages() {
        return RentPackageRepository.findAll();
    }

    @Override
    @Transactional
    public RentPackage updateRentPackage(UUID id, RentPackage pkg) {
        Objects.requireNonNull(id, "id must not be null");
        if (pkg == null) throw new AppException(ErrorCode.INVALID_RENTPACKAGE);

        RentPackage existing = RentPackageRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RENTPACKAGE_NOT_FOUND));

        if (pkg.getRentPackageName() != null && !pkg.getRentPackageName().trim().isEmpty()) {
            existing.setRentPackageName(pkg.getRentPackageName());
        }

        // allow price to be updated to zero; only reject negative updates
        if (pkg.getPrice().compareTo(BigDecimal.ZERO) >= 0) {
            existing.setPrice(pkg.getPrice());
        }

        if (pkg.getDurationDays() >= 0) {
            existing.setDurationDays(pkg.getDurationDays());
        }

        RentPackage updated = RentPackageRepository.save(existing);
        log.info("Updated RentPackage id={}", updated.getRentPackageId());
        return updated;
    }

    @Override
    @Transactional
    public void deleteRentPackage(UUID id) {
        Objects.requireNonNull(id, "id must not be null");
        RentPackage existing = RentPackageRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RENTPACKAGE_NOT_FOUND));
        RentPackageRepository.delete(existing);
        log.info("Deleted RentPackage id={}", id);
    }
}

