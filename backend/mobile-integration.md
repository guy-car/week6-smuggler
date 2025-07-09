# Mobile Development Environment Configuration Specification

## 1. Overview

This specification addresses the mobile development connectivity issue where React Native/Expo apps cannot access backend servers running on `localhost:3000` from physical devices. The solution provides a configurable IP-based connection system that supports both local and remote development scenarios.

### Problem Statement
- Backend server runs on `localhost:3000` (development machine)
- Mobile devices (phones/tablets) cannot access `localhost` on development machine
- Multiple developers need individual configuration for their environments
- CORS and WebSocket connections must adapt to different IP addresses

### Solution Overview
- Environment-based IP configuration for backend URL
- Automatic CORS adaptation based on configured IP
- Simple, minimal implementation without unnecessary complexity

## 2. Architecture Diagram

```mermaid
graph LR
    ExpoClient[Expo Client App]
    ExpoDevServer[Expo Dev Server :8081]
    BackendServer[Backend Server :3000]
    EnvConfig[Environment Config]
    
    EnvConfig -->|EXPO_PUBLIC_BACKEND_URL| ExpoClient
    ExpoClient -->|WebSocket Connection| BackendServer
    ExpoDevServer -->|CORS Origin| BackendServer
    
    subgraph "Development Machine"
        BackendServer
        ExpoDevServer
    end
    
    subgraph "Mobile Device"
        ExpoClient
    end
    
    subgraph "Configuration"
        EnvConfig
    end
```

## 3. Configuration

### Environment Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `EXPO_PUBLIC_BACKEND_URL` | string | `http://localhost:3000` | Backend server URL for mobile app |
| `BACKEND_CORS_ORIGIN` | string | `http://localhost:8081` | CORS origin for Expo dev server |
| `BACKEND_PORT` | integer | `3000` | Backend server port |

### Configuration Files

**Frontend `.env` (per developer):**
```yaml
# Mobile app backend connection
EXPO_PUBLIC_BACKEND_URL=http://192.168.1.100:3000

# Optional: Override Expo dev server port
EXPO_PUBLIC_EXPO_PORT=8081
```

**Backend `.env` (per developer):**
```yaml
# Server configuration
PORT=3000
NODE_ENV=development

# CORS configuration (auto-detected from EXPO_PUBLIC_BACKEND_URL)
BACKEND_CORS_ORIGIN=http://192.168.1.100:8081
```

## 4. API / Protocol

### Connection Endpoints

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/api/health` | GET | Basic health check | `{ status: "ok", timestamp: string }` |

### WebSocket Events

*No additional events needed - existing WebSocket connection events provide sufficient feedback*

### Error Handling

| Error Type | HTTP Status | Response | Mobile App Action |
|------------|-------------|----------|-------------------|
| Connection Refused | N/A | WebSocket error | Show connection error screen |
| CORS Error | 403 | CORS policy violation | Log error, suggest IP check |
| Timeout | N/A | Connection timeout | Retry with exponential backoff |

## 5. Phases & Tasks

### Phase 1: Environment Configuration Setup ✅ COMPLETED
- [x] Create `.env.example` files for both frontend and backend
- [x] Update backend CORS configuration to use environment variable
- [x] Modify frontend WebSocket service to use `EXPO_PUBLIC_BACKEND_URL`
- [x] Add connection validation endpoint to backend
- [x] Update backend server startup to log configured URLs
- [x] Add IP address detection utility for developers
- [x] Create environment validation script
- [x] Update `.gitignore` to exclude individual `.env` files

**Implementation Notes:**
- Kept implementation minimal and simple
- Backend CORS now uses `BACKEND_CORS_ORIGIN` environment variable
- Frontend WebSocket already uses `EXPO_PUBLIC_BACKEND_URL` environment variable
- Health endpoint shows configured URLs for debugging
- Server startup logs show mobile connection URL
- Simple environment variable test created

### Phase 2: Error Handling & User Experience
- [ ] Create clear connection error UI components
- [ ] Add helpful error messages for common issues (wrong IP, server down)
- [ ] Implement simple retry button for connection failures
- [ ] Add connection status indicators in mobile app
- [ ] Create connection troubleshooting guide
- [ ] Add helpful console logging for debugging
- [ ] Implement graceful error display without blocking app
- [ ] Add "Check Connection" button in settings/error screens

### Phase 3: Developer Experience & Documentation
- [ ] Create setup guide in README.md
- [ ] Add IP address discovery script
- [ ] Create environment configuration wizard
- [ ] Add connection testing commands to package.json
- [ ] Document troubleshooting steps
- [ ] Create development environment checklist
- [ ] Add environment validation to CI/CD pipeline
- [ ] Create developer onboarding documentation

## 6. Testing Strategy

### Unit Tests
- [ ] Environment variable parsing and validation
- [ ] CORS configuration adaptation
- [ ] Connection URL construction
- [ ] Error handling and retry logic

### Integration Tests
- [ ] End-to-end connection from mobile app to backend
- [ ] CORS policy enforcement with different IP addresses
- [ ] WebSocket connection establishment
- [ ] Error handling for connection failures

### Manual Testing Checklist
- [ ] Local development machine connection
- [ ] Remote developer connection (different network)
- [ ] Connection with different IP addresses
- [ ] Error scenarios (wrong IP, server down, network issues)
- [ ] Multiple developers testing simultaneously

## 7. Monitoring & Metrics

### Connection Metrics
- [ ] Connection success/failure rates
- [ ] Connection latency measurements
- [ ] WebSocket connection stability
- [ ] Environment configuration usage

### Error Tracking
- [ ] Connection error types and frequencies
- [ ] CORS violation tracking
- [ ] Timeout and retry statistics
- [ ] Developer environment issues

### Health Monitoring
- [ ] Backend server availability
- [ ] Mobile app connection status
- [ ] Environment configuration validation
- [ ] Development environment health checks

## 8. Deployment

### Development Environment Setup
1. **IP Address Discovery**: Developers run `npm run discover-ip` to get their local IP
2. **Environment Configuration**: Copy `.env.example` to `.env` and update with local IP
3. **App Startup**: Mobile app attempts connection and shows errors if needed

### Configuration Validation
- [ ] Environment variable presence and format validation
- [ ] Basic CORS configuration verification

### Rollback Strategy
- [ ] Fallback to localhost if environment variable missing
- [ ] Graceful degradation for connection failures
- [ ] Clear error messages for configuration issues
- [ ] Quick setup guide for new developers

## 9. Success Criteria

### Connection Success
- [ ] Mobile app successfully connects to backend using configured IP
- [ ] WebSocket connections establish without CORS errors
- [ ] Connection validation endpoints respond correctly
- [ ] Multiple developers can connect simultaneously

### Developer Experience
- [ ] New developers can set up environment in <5 minutes
- [ ] Connection issues are clearly identified and resolved
- [ ] Environment configuration is documented and easy to follow
- [ ] Setup process is automated where possible

### Error Handling
- [ ] Connection failures show clear error messages
- [ ] Retry logic prevents unnecessary connection attempts
- [ ] Fallback mechanisms work when primary connection fails
- [ ] Troubleshooting guide resolves common issues

### Performance
- [ ] Connection establishment time <2 seconds
- [ ] WebSocket connection stability >99%
- [ ] Environment validation completes in <1 second
- [ ] No performance impact on existing functionality
