// شريط التنقل العلوي للموقع - يدعم التخصيص من لوحة الإدارة
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { usePageContent } from "@/hooks/usePageContent";

const DEFAULT_LOGO = "https://www.aljazeera.com.qa/wp-content/themes/aljazeera/images/logos/tamweel.svg";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const nav = usePageContent("navbar");
  const colors = usePageContent("site_colors");

  const navBg      = colors.primary_color   || "#1e3a5f";
  const accentBg   = colors.accent_color    || "#c8a84b";
  const textColor  = nav.navbar_text_color  || "rgba(255,255,255,0.85)";
  const logoUrl    = nav.logo_url !== undefined ? nav.logo_url : DEFAULT_LOGO;

  return (
    <nav style={{ backgroundColor: navBg }} className="text-white shadow-lg sticky top-0 z-50" dir="rtl">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <a href="/" className="flex items-center">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={nav.company_name || "الجزيرة للتمويل"}
                className="h-10 max-w-[180px] object-contain"
                style={{ filter: "brightness(0) invert(1)" }}
              />
            ) : (
              <div>
                <span className="font-black text-lg leading-tight block">{nav.company_name || "الجزيرة"}</span>
                <span className="text-xs text-white/70 block">{nav.company_subtitle || "للتمويل والحلول المالية"}</span>
              </div>
            )}
          </a>

          <div className="hidden md:flex items-center gap-8">
            <a href="/" style={{ color: textColor }} className="hover:opacity-100 opacity-85 transition-opacity font-medium">{nav.link_home || "الرئيسية"}</a>
            <a href="/#services" style={{ color: textColor }} className="hover:opacity-100 opacity-85 transition-opacity font-medium">{nav.link_services || "خدماتنا"}</a>
            <a href="/#contact" style={{ color: textColor }} className="hover:opacity-100 opacity-85 transition-opacity font-medium">{nav.link_contact || "تواصل معنا"}</a>
            <a
              href="/apply"
              className="px-6 py-2 rounded-lg font-bold text-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: accentBg, color: navBg }}
            >
              {nav.apply_btn || "قدّم الآن"}
            </a>
          </div>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-white/10"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden py-4 border-t border-white/20 space-y-2">
            <a href="/" onClick={() => setIsOpen(false)} style={{ color: textColor }} className="block px-4 py-2 hover:bg-white/10 rounded-lg transition-colors">{nav.link_home || "الرئيسية"}</a>
            <a href="/#services" onClick={() => setIsOpen(false)} style={{ color: textColor }} className="block px-4 py-2 hover:bg-white/10 rounded-lg transition-colors">{nav.link_services || "خدماتنا"}</a>
            <a href="/#contact" onClick={() => setIsOpen(false)} style={{ color: textColor }} className="block px-4 py-2 hover:bg-white/10 rounded-lg transition-colors">{nav.link_contact || "تواصل معنا"}</a>
            <a
              href="/apply"
              onClick={() => setIsOpen(false)}
              className="block mx-4 py-2 rounded-lg font-bold text-center transition-opacity hover:opacity-90"
              style={{ backgroundColor: accentBg, color: navBg }}
            >
              {nav.apply_btn || "قدّم الآن"}
            </a>
          </div>
        )}
      </div>
    </nav>
  );
}
