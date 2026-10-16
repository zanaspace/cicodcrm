/** Password rules shared by the reset form and the reset route. TODO(confirm): match the backend's policy. */
export const PASSWORD_MIN_LENGTH = 10;

export function passwordProblem(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) return `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
  if (!/[a-z]/i.test(password) || !/\d/.test(password)) return "Use at least one letter and one number.";
  return null;
}

export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
