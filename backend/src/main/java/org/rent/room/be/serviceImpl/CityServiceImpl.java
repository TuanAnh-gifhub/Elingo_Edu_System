package org.rent.room.be.serviceImpl;

import lombok.RequiredArgsConstructor;
import org.rent.room.be.dto.response.CityResponse;
import org.rent.room.be.repository.CityRepository;
import org.rent.room.be.service.CityService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CityServiceImpl implements CityService {

    private final CityRepository cityRepository;

    @Override
    public List<CityResponse> getAllCities() {
        return cityRepository.findAllByOrderByCityIdAsc()
                .stream()
                .map(c -> CityResponse.builder()
                        .cityId(c.getCityId())
                        .cityName(c.getCityName())
                        .build())
                .toList();
    }
}
