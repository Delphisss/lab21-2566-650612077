"use client";
import { Footer } from "@/components/Footer";
import { MantineWrapper } from "@/libs/MantineWrapper";
import { $authenStore } from "@/libs/authenStore";
import { Container, Group, Loader, Title } from "@mantine/core";
import axios from "axios";
import { Inter } from "next/font/google";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  const [isCheckingAuthen, setIsCheckingAuthen] = useState(true);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  const checkAuthen = async () => {
    const token = localStorage.getItem("token");
    const authenUsername = localStorage.getItem("authenUsername");

    //check within localStorage
    let isTokenValid = true;
    if (!token || !authenUsername) {
      isTokenValid = false;
    } else {
      //check if token still valid
      try {
        const resp = await axios.get("/api/user/checkAuthen", {
          headers: { Authorization: `Bearer ${token}` },
        });
        $authenStore.set({ token, authenUsername });
      } catch (err) {
        console.log(err.message);
        isTokenValid = false;
      }
    }

    //go to login if not logged in yet and trying to access protected route
    if (pathname !== "/" && !isTokenValid) {
      startTransition(() => {
        router.push("/");
      });
      //go to /student if already logged in
    } else if (pathname === "/" && isTokenValid) {
      startTransition(() => {
        router.push("/student");
      });
    }
    setIsCheckingAuthen(false);
  };

  useEffect(() => {
    checkAuthen();
  }, []);

  return (
    <html lang="en">
      <body className={inter.className}>
        <MantineWrapper>
          {(isCheckingAuthen || isPending) && (
            <Group position="center">
              <Loader />
            </Group>
          )}
          {!isCheckingAuthen && !isPending && (
            <Container size="sm">
              <Title italic align="center" color="violet" my="xs">
                Course Enrollment
              </Title>
              {children}
              <Footer
                studentId="650612077"
                fullName="Kong Kanjai"
                year="2023"
              />
            </Container>
          )}
        </MantineWrapper>
      </body>
    </html>
  );
}
