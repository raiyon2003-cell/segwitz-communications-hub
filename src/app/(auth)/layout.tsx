import { BrandLogo } from "@/components/brand/brand-logo";
import { Send, FileText, Users } from "lucide-react";

const features = [
  {
    icon: Send,
    title: "Email composer",
    description: "Send branded communications with approved templates.",
  },
  {
    icon: FileText,
    title: "Template management",
    description: "Rich text and HTML templates with variable support.",
  },
  {
    icon: Users,
    title: "Contact database",
    description: "Manage clients, prospects, and team contacts in one place.",
  },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[42%_1fr]">
      <aside className="brand-gradient-auth relative hidden flex-col justify-between p-10 xl:p-14 lg:flex">
        <BrandLogo variant="light" size="md" />

        <div className="max-w-sm space-y-4">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-white">
            Centralized communications for SegWitz
          </h1>
          <p className="text-[15px] leading-relaxed text-white/75">
            Manage templates, contacts, and email history in one professional
            hub built for your team.
          </p>
        </div>

        <div className="space-y-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="h-5 w-5 text-white/90" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {feature.title}
                  </p>
                  <p className="text-sm text-white/65">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-white/50">
          &copy; {new Date().getFullYear()} SegWitz. All rights reserved.
        </p>
      </aside>

      <div className="brand-surface-subtle flex min-h-screen items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-md">
          <div className="mb-6 flex justify-center lg:hidden">
            <BrandLogo size="md" />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
