package org.rent.room.be.serviceImpl;

import lombok.RequiredArgsConstructor;
import org.rent.room.be.dto.request.CreatePackageRequest;
import org.rent.room.be.dto.request.UpdatePackageRequest;
import org.rent.room.be.dto.response.PackageResponse;
import org.rent.room.be.entity.Package;
import org.rent.room.be.entity.User;
import org.rent.room.be.entity.Wallet;
import org.rent.room.be.repository.PackageRepository;
import org.rent.room.be.service.PackageService;
import org.rent.room.be.service.UserService;
import org.rent.room.be.service.WalletService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PackageServiceImpl implements PackageService {

    private final PackageRepository packageRepository;
    private final WalletService walletService;
    private final UserService userService;
    private final PackageMapper packageMapper;

    @Override
    @Transactional
    public PackageResponse createPackage(CreatePackageRequest request) {
        Package newPackage = new Package();
        newPackage.setName(request.getName());
        newPackage.setDescription(request.getDescription());
        newPackage.setPrice(request.getPrice());
        newPackage.setDurationInDays(request.getDurationInDays());
        Package savedPackage = packageRepository.save(newPackage);
        return packageMapper.toPackageResponse(savedPackage);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PackageResponse> getAllPackages() {
        return packageRepository.findAll().stream()
                .map(packageMapper::toPackageResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PackageResponse getPackageById(UUID id) {
        Package pkg = packageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Package not found"));
        return packageMapper.toPackageResponse(pkg);
    }

    @Override
    @Transactional
    public PackageResponse updatePackage(UUID id, UpdatePackageRequest request) {
        Package pkg = packageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Package not found"));
        pkg.setName(request.getName());
        pkg.setDescription(request.getDescription());
        pkg.setPrice(request.getPrice());
        pkg.setDurationInDays(request.getDurationInDays());
        Package updatedPackage = packageRepository.save(pkg);
        return packageMapper.toPackageResponse(updatedPackage);
    }

    @Override
    @Transactional
    public void deletePackage(UUID id) {
        packageRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void purchasePackage(UUID packageId) {
        User currentUser = userService.getCurrentUserEntity();
        Wallet wallet = walletService.getOrCreateWallet(currentUser);
        Package pkg = packageRepository.findById(packageId)
                .orElseThrow(() -> new RuntimeException("Package not found"));

        BigDecimal price = BigDecimal.valueOf(pkg.getPrice());
        walletService.debit(wallet, price);

        // Here you would add the logic to activate the package for the user.
        // For example, you could add a new entity `UserPackage` to track the user's active packages.
        // You could also add a role to the user.
    }
}

