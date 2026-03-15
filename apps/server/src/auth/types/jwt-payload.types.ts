export interface JwtPayload {
  sub: string; // hashed username (from IP)
  username: string; // same hash for display
}

export interface RefreshPayload extends JwtPayload {
  type: 'refresh';
}
