import NextAuth from "next-auth";
import { madingAuthOptions } from "@/lib/mading-auth";

const handler = NextAuth(madingAuthOptions);

export { handler as GET, handler as POST };
