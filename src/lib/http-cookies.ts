export type CookieWriter = {
  get(name: string): string | undefined;
  set(
    name: string,
    value: string,
    options: {
      path: string;
      sameSite: "lax";
      httpOnly: boolean;
      secure: boolean;
      maxAge: number;
    },
  ): void;
};

export function httpCookieOptions(maxAge: number) {
  return {
    path: "/",
    sameSite: "lax" as const,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge,
  };
}
