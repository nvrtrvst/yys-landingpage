import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/scp/login",
  },
});

export const config = {
  matcher: ["/scp/((?!login).*)"],
};
