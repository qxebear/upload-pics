"use client";
import NextLink from "next/link";

interface CustomLinkProps extends React.ComponentProps<typeof NextLink> {
  children: React.ReactNode;
}

export default function Link({ children, href, ...props }: CustomLinkProps) {
  return (
    <NextLink {...props} href={href}>
      {children}
    </NextLink>
  );
}
