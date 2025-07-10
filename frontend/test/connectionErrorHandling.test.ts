import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import ConnectionErrorScreen from '../app/components/ConnectionErrorScreen';
import ConnectionStatusIndicator from '../app/components/ConnectionStatusIndicator';
import { useGameStore } from '../store/gameStore';

// Mock fetch for connection testing
(global as any).fetch = jest.fn();

describe('Connection Error Handling', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useGameStore.setState({
            connected: false,
            error: null,
            isLoading: false,
            socketId: null,
        });
    });

    describe('ConnectionErrorScreen', () => {
        it('renders with generic error message when no error is provided', () => {
            const { getByText } = render(React.createElement(ConnectionErrorScreen));

            expect(getByText('Connection Error')).toBeTruthy();
            expect(getByText('Unknown error occurred')).toBeTruthy();
        });

        it('renders with specific error message for network connection failures', () => {
            useGameStore.setState({
                error: 'Failed to connect to /192.168.1.100:3000',
                connected: false,
            });

            const { getByText } = render(React.createElement(ConnectionErrorScreen));

            expect(getByText('Network Connection Failed')).toBeTruthy();
            expect(getByText(/Your device cannot reach the game server/)).toBeTruthy();
            expect(getByText(/Check if the backend server is running/)).toBeTruthy();
        });

        it('shows retry button with loading state', () => {
            useGameStore.setState({
                error: 'Test error',
                isLoading: true,
                connected: false,
            });

            const { getByText } = render(React.createElement(ConnectionErrorScreen));

            expect(getByText('Retrying...')).toBeTruthy();
        });

        it('shows test connection button', () => {
            const { getByText } = render(React.createElement(ConnectionErrorScreen));

            expect(getByText('Test Connection')).toBeTruthy();
        });

        it('shows troubleshooting guide button', () => {
            const { getByText } = render(React.createElement(ConnectionErrorScreen));

            expect(getByText('📖 Troubleshooting Guide')).toBeTruthy();
        });

        it('displays debug information', () => {
            useGameStore.setState({
                error: 'Test error message',
                connected: false,
            });

            const { getByText } = render(React.createElement(ConnectionErrorScreen));

            expect(getByText(/Backend URL:/)).toBeTruthy();
            expect(getByText(/Error: Test error message/)).toBeTruthy();
        });

        it('shows connection test results inline', async () => {
            ((global as any).fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                status: 200,
            });

            const { getByText } = render(React.createElement(ConnectionErrorScreen));

            fireEvent.press(getByText('Test Connection'));

            await waitFor(() => {
                expect(getByText(/✅ Backend server is reachable/)).toBeTruthy();
            });
        });

        it('shows error when connection test fails', async () => {
            ((global as any).fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

            const { getByText } = render(React.createElement(ConnectionErrorScreen));

            fireEvent.press(getByText('Test Connection'));

            await waitFor(() => {
                expect(getByText(/❌ Cannot reach backend server/)).toBeTruthy();
            });
        });
    });

    describe('ConnectionStatusIndicator', () => {
        it('shows connected state with green indicator', () => {
            useGameStore.setState({
                connected: true,
                socketId: 'test-socket-id',
                error: null,
            });

            const { getByText } = render(React.createElement(ConnectionStatusIndicator, { showDetails: true }));

            expect(getByText('Connected')).toBeTruthy();
            expect(getByText(/Socket ID: test-soc/)).toBeTruthy();
        });

        it('shows error state with red indicator', () => {
            useGameStore.setState({
                connected: false,
                error: 'Connection failed',
                socketId: null,
            });

            const { getByText } = render(React.createElement(ConnectionStatusIndicator, { showDetails: true }));

            expect(getByText('Connection Error')).toBeTruthy();
            expect(getByText(/Connection failed/)).toBeTruthy();
        });

        it('shows connecting state with yellow indicator', () => {
            useGameStore.setState({
                connected: false,
                error: null,
                socketId: null,
            });

            const { getByText } = render(React.createElement(ConnectionStatusIndicator, { showDetails: true }));

            expect(getByText('Connecting...')).toBeTruthy();
            expect(getByText(/Attempting to connect/)).toBeTruthy();
        });

        it('renders in compact mode', () => {
            useGameStore.setState({
                connected: true,
                socketId: 'test-socket-id',
                error: null,
            });

            const { getByText } = render(React.createElement(ConnectionStatusIndicator, { compact: true, showDetails: true }));

            expect(getByText('Connected')).toBeTruthy();
        });
    });

    describe('Error Message Parsing', () => {
        it('correctly identifies network connection failures', () => {
            useGameStore.setState({
                error: 'Failed to connect to /192.168.1.100:3000',
                connected: false,
            });

            const { getByText } = render(React.createElement(ConnectionErrorScreen));

            expect(getByText('Network Connection Failed')).toBeTruthy();
            expect(getByText(/Check if the backend server is running/)).toBeTruthy();
            expect(getByText(/Verify your IP address/)).toBeTruthy();
        });

        it('correctly identifies CORS errors', () => {
            useGameStore.setState({
                error: 'CORS policy violation: No \'Access-Control-Allow-Origin\' header',
                connected: false,
            });

            const { getByText } = render(React.createElement(ConnectionErrorScreen));

            expect(getByText('CORS Policy Error')).toBeTruthy();
            expect(getByText(/Check if the backend CORS configuration/)).toBeTruthy();
        });

        it('correctly identifies timeout errors', () => {
            useGameStore.setState({
                error: 'Connection timeout after 10000ms',
                connected: false,
            });

            const { getByText } = render(React.createElement(ConnectionErrorScreen));

            expect(getByText('Connection Timeout')).toBeTruthy();
            expect(getByText(/Check if the backend server is running and responsive/)).toBeTruthy();
        });

        it('handles unknown error types gracefully', () => {
            useGameStore.setState({
                error: 'Some unknown error occurred',
                connected: false,
            });

            const { getByText } = render(React.createElement(ConnectionErrorScreen));

            expect(getByText('Connection Error')).toBeTruthy();
            expect(getByText('Some unknown error occurred')).toBeTruthy();
            expect(getByText(/Check your internet connection/)).toBeTruthy();
        });
    });
}); 