package org.rent.room.be.security;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CustomUserDetailsService implements UserDetailsService {

    UserRepository usersRepository;

    @Override
    public UserDetails loadUserByUsername(String email) {
        return usersRepository.findByEmail(email)
                .map(CustomUserDetails::new)
                .orElseThrow(() ->
                        new UsernameNotFoundException("User not found")
                );
    }
}
