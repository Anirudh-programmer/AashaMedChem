import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <SignIn 
      routing="path" 
      path="/sign-in" 
      appearance={{
        variables: {
          colorPrimary: "#4f46e5",
          colorText: "#1e1b4b",
          colorTextSecondary: "#52525b",
          borderRadius: "12px",
        },
        elements: {
          card: "shadow-xl border border-white/80 bg-white/90",
          headerTitle: "font-semibold tracking-tight",
          socialButtonsBlockButton: "border border-zinc-200/80 hover:bg-zinc-50 transition-colors",
          formButtonPrimary: "bg-indigo-600 hover:bg-indigo-700 transition-colors text-white font-medium",
        }
      }}
    />
  );
}
