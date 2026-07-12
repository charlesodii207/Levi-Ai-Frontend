export function saveToken(token: string) {
  localStorage.setItem("levi_token", token);
}

export function getToken(): string | null {
  return localStorage.getItem("levi_token");
}

export function removeToken() {
  localStorage.removeItem("levi_token");
}

export function isLoggedIn(): boolean {
  return !!getToken();
}
