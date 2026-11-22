package com.trustdesk.auth;

import com.trustdesk.dto.AuthRequest;
import com.trustdesk.dto.AuthResponse;
import com.trustdesk.dto.RegisterRequest;
import com.trustdesk.dto.UserInfoResponse;

public interface AuthService {

    AuthResponse login(AuthRequest request);

    void register(RegisterRequest request);

    UserInfoResponse me(String username);
}
