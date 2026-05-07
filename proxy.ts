import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/sign-in"
  }
});

export const config = {
  matcher: ["/dashboard/:path*", "/map/:path*", "/friends/:path*", "/keys/:path*", "/settings/:path*"]
};
