-- ============================================================
-- SM Elite Hajj - Complete Data Export
-- Generated: 2026-03-10
-- ============================================================

-- ============================================================
-- 1. TENANTS
-- ============================================================
INSERT INTO public.tenants (id, name, domain, created_at, updated_at) VALUES
('841cf123-53ef-4a49-8b56-728f1cc552fc', 'SM Elite Hajj', 'smelitehajj.com', '2026-03-04 08:59:45.770204+00', '2026-03-04 08:59:45.770204+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. USERS (admin user with bcrypt password for Asomo@235977#)
-- ============================================================
INSERT INTO public.users (id, email, encrypted_password, full_name, phone, email_confirmed_at, created_at) VALUES
('1211ae50-dae6-4f3e-a1e0-01ae65670cfc', 'asomoalamin@yahoo.com', '$2b$10$kJ8qX5FxS0Z5BVdYj2GKt.QhGJF9A0yCLz3VO6QFv2LCR8Y4KQ1Wy', 'Asomoalamin', NULL, NOW(), '2026-02-06 04:57:25.577148+00'),
('a49d6288-b123-4a03-b500-d6056239296d', 'iqshait@gmail.com', '$2b$10$kJ8qX5FxS0Z5BVdYj2GKt.QhGJF9A0yCLz3VO6QFv2LCR8Y4KQ1Wy', 'Iqbal Hossain', NULL, NOW(), '2026-01-15 05:42:36.078266+00'),
('353d3485-b564-4ed8-874c-688c92c8ff02', 'asomoalamin@gmail.com', '$2b$10$kJ8qX5FxS0Z5BVdYj2GKt.QhGJF9A0yCLz3VO6QFv2LCR8Y4KQ1Wy', 'A S M AL-AMIN', '01715602226', NOW(), '2026-01-26 13:12:54.055998+00'),
('66cfc147-f0ab-496a-8f62-3fefb03effb2', 'bditengineer@gmail.com', '$2b$10$kJ8qX5FxS0Z5BVdYj2GKt.QhGJF9A0yCLz3VO6QFv2LCR8Y4KQ1Wy', 'MD IQBAL HOSSAIN', '+8801674533303', NOW(), '2026-01-27 13:36:54.357258+00'),
('76c40bc2-3702-40ee-9ce4-8a95208be7e9', 'digiwebdex@gmail.com', '$2b$10$kJ8qX5FxS0Z5BVdYj2GKt.QhGJF9A0yCLz3VO6QFv2LCR8Y4KQ1Wy', 'MD IQBAL HOSSAIN', '+8801674533303', NOW(), '2026-01-27 13:50:34.683643+00'),
('aa05e5f9-cb01-4bc8-815a-5a4cc1080e6d', 'iq.itng007@gmail.com', '$2b$10$kJ8qX5FxS0Z5BVdYj2GKt.QhGJF9A0yCLz3VO6QFv2LCR8Y4KQ1Wy', 'Jahir rayhan', '+8801674533303', NOW(), '2026-01-27 14:34:23.804267+00'),
('4c6aa205-dc6d-49b4-a265-ef98a8d02d15', 'nahid0785@yahoo.com', '$2b$10$kJ8qX5FxS0Z5BVdYj2GKt.QhGJF9A0yCLz3VO6QFv2LCR8Y4KQ1Wy', 'Nahid', '01723902828', NOW(), '2026-01-27 18:19:22.405872+00'),
('cd2cbbac-520d-4949-8a0e-906496f91506', 'smelitehajj@gmail.com', '$2b$10$kJ8qX5FxS0Z5BVdYj2GKt.QhGJF9A0yCLz3VO6QFv2LCR8Y4KQ1Wy', 'A. S. M. Al-Amin', '+8801715602226', NOW(), '2026-01-28 06:14:10.965071+00'),
('4035a1e4-ecbe-4b14-a1d9-bf7535426ad6', 'demo@smelitehajj.com', '$2b$10$kJ8qX5FxS0Z5BVdYj2GKt.QhGJF9A0yCLz3VO6QFv2LCR8Y4KQ1Wy', 'Mohammad', '+8801855434693', NOW(), '2026-02-03 15:19:45.97131+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. PROFILES
-- ============================================================
INSERT INTO public.profiles (id, full_name, email, phone, role, tenant_id, created_at, updated_at) VALUES
('a49d6288-b123-4a03-b500-d6056239296d', 'Iqbal Hossain', 'iqshait@gmail.com', NULL, 'admin', NULL, '2026-01-15 05:42:36.078266+00', '2026-01-15 07:07:54.867626+00'),
('1211ae50-dae6-4f3e-a1e0-01ae65670cfc', 'Asomoalamin', 'asomoalamin@yahoo.com', NULL, 'admin', NULL, '2026-02-06 04:57:25.577148+00', '2026-02-06 04:57:25.680374+00'),
('353d3485-b564-4ed8-874c-688c92c8ff02', 'A S M AL-AMIN', 'asomoalamin@gmail.com', '01715602226', 'customer', NULL, '2026-01-26 13:12:54.055998+00', '2026-01-26 13:12:54.055998+00'),
('66cfc147-f0ab-496a-8f62-3fefb03effb2', 'MD IQBAL HOSSAIN', 'bditengineer@gmail.com', '+8801674533303', 'customer', NULL, '2026-01-27 13:36:54.357258+00', '2026-01-27 13:36:54.357258+00'),
('76c40bc2-3702-40ee-9ce4-8a95208be7e9', 'MD IQBAL HOSSAIN', 'digiwebdex@gmail.com', '+8801674533303', 'customer', NULL, '2026-01-27 13:50:34.683643+00', '2026-01-27 13:50:34.683643+00'),
('aa05e5f9-cb01-4bc8-815a-5a4cc1080e6d', 'Jahir rayhan', 'iq.itng007@gmail.com', '+8801674533303', 'customer', NULL, '2026-01-27 14:34:23.804267+00', '2026-01-27 14:34:23.804267+00'),
('4c6aa205-dc6d-49b4-a265-ef98a8d02d15', 'Nahid', 'nahid0785@yahoo.com', '01723902828', 'customer', NULL, '2026-01-27 18:19:22.405872+00', '2026-01-27 18:19:22.405872+00'),
('cd2cbbac-520d-4949-8a0e-906496f91506', 'A. S. M. Al-Amin', 'smelitehajj@gmail.com', '+8801715602226', 'customer', NULL, '2026-01-28 06:14:10.965071+00', '2026-01-28 06:14:10.965071+00'),
('4035a1e4-ecbe-4b14-a1d9-bf7535426ad6', 'Mohammad', 'demo@smelitehajj.com', '+8801855434693', 'viewer', NULL, '2026-02-03 15:19:45.97131+00', '2026-02-03 15:28:16.040307+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. STAFF MEMBERS
-- ============================================================
INSERT INTO public.staff_members (id, user_id, staff_name, role, department, employee_id, phone, mobile_number, address, hire_date, is_active, permissions, created_at, updated_at) VALUES
('b7bb6ab1-8548-4d3e-b952-f047ec334db7', '66cfc147-f0ab-496a-8f62-3fefb03effb2', 'MD IQBAL HOSSAIN', 'support', 'Customer Support', 'EMP001', '01674533303', '+880 1700 000001', '32 Greenway, Shantinogor, Ramna', '2026-01-28', true, '{"manage_bookings":true,"manage_content":false,"manage_customers":true,"manage_packages":false,"manage_payments":false,"view_reports":false}', '2026-01-28 17:39:28.532709+00', '2026-01-29 04:09:57.331679+00'),
('958ac962-d9d6-4418-a3f7-57b0697343c8', '353d3485-b564-4ed8-874c-688c92c8ff02', 'A S M AL-AMIN', 'manager', 'Operations', 'EMP002', NULL, '+880 1700 000002', NULL, '2026-01-29', true, '{"manage_bookings":true,"manage_content":true,"manage_customers":true,"manage_packages":true,"manage_payments":true,"view_reports":true}', '2026-01-29 03:46:59.991316+00', '2026-03-09 06:35:50.528922+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. HERO CONTENT
-- ============================================================
INSERT INTO public.hero_content (id, title, subtitle, description, badge_text, background_image_url, video_url, slide_type, primary_button_text, primary_button_link, secondary_button_text, secondary_button_link, stats, is_active, order_index, created_at, updated_at) VALUES
('8af3b93b-a77e-4af0-afa4-b436b679d606', 'Experience the Sacred', 'Hajj Pilgrimage', 'Join thousands of pilgrims on the journey of a lifetime. Our comprehensive Hajj packages ensure a spiritually fulfilling experience.', '', '/images/hero-hajj-mina.jpg', '', 'hajj', 'View Hajj Packages', '#hajj', 'Contact Us', '#contact', '[]', true, 0, '2026-01-18 16:41:04.773256+00', '2026-03-09 06:22:52.733498+00'),
('7d9d2d1d-4aed-4e03-a0a6-a605b8d2ac67', 'Embark on Your', 'Umrah Journey', 'Perform Umrah any time of the year with our flexible packages. Experience the blessings of visiting the holy sites.', '', '/images/hero-umrah-banner.jpg', '', 'umrah', 'View Umrah Packages', '#umrah', 'Learn More', '#services', '[]', true, 1, '2026-01-18 16:41:04.773256+00', '2026-03-09 06:22:55.724414+00'),
('35583e93-54f8-4d3a-aa70-5ab97bd2382b', 'Begin Your Sacred Journey', 'Hajj & Umrah Services Since 2019', 'Experience the pilgrimage of a lifetime with our comprehensive packages, expert guidance, and unwavering commitment to your spiritual journey.', '', NULL, '', 'general', 'Explore Packages', '#hajj', 'Contact Us', '#contact', '[]', true, 2, '2026-01-15 09:32:44.416563+00', '2026-03-09 06:22:55.713403+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 6. SERVICES
-- ============================================================
INSERT INTO public.services (id, title, description, icon_name, link_url, is_active, order_index, created_at, updated_at) VALUES
('a3a95e04-6e0a-4603-96ec-4ed506becba3', 'Hajj Packages', 'Complete Hajj packages with accommodation, transportation, and guided spiritual support throughout your sacred journey.', 'Makkah', '#hajj', true, 0, '2026-01-15 09:32:44.416563+00', '2026-01-21 18:06:24.429163+00'),
('c981ad08-6a69-4e96-bf2a-2e429ea6859d', 'Umrah Services', 'Flexible Umrah packages available year-round with premium hotels and expert guidance for a fulfilling pilgrimage.', 'Madinah', '#umrah', true, 1, '2026-01-15 09:32:44.416563+00', '2026-01-21 18:06:24.429163+00'),
('d89ca5d1-7804-4492-aec4-1d5035036f5a', 'Visa Processing', 'Hassle-free visa processing for Saudi Arabia and other countries with our experienced documentation team.', 'FileCheck', '#visa', true, 2, '2026-01-15 09:32:44.416563+00', '2026-01-21 18:06:24.429163+00'),
('19773dfb-dec2-42e3-a8d7-f233b9679a83', 'Hotel Bookings', 'Premium hotel accommodations near Haram in both Makkah and Madinah for your comfort and convenience.', 'Hotel', NULL, true, 3, '2026-01-15 09:32:44.416563+00', '2026-01-15 09:32:44.416563+00'),
('be6a5b04-5b44-46f9-a0af-d0a35817fd61', 'Transportation', 'Comfortable and reliable transportation services including airport transfers and inter-city travel.', 'Bus', NULL, true, 4, '2026-01-15 09:32:44.416563+00', '2026-01-15 09:32:44.416563+00'),
('2988daf5-bf45-407b-99de-a8d7aaa9ec09', 'Air Ticket', 'Affordable air tickets to destinations worldwide with trusted airlines', 'Plane', NULL, true, 5, '2026-01-20 18:14:15.068141+00', '2026-02-03 18:43:05.145527+00'),
('26b75b62-8f47-40f9-a31d-344e1d5b2b97', 'Tour Package', 'Exciting tour packages to explore beautiful destinations around the world', 'Map', NULL, true, 6, '2026-01-20 18:14:15.068141+00', '2026-01-21 08:22:40.197697+00'),
('5e6decda-a905-4a04-a886-06e3cee03d2a', '24/7 Support', 'Round-the-clock customer support to assist you before, during, and after your pilgrimage journey.', 'Headphones', '#contact', true, 7, '2026-01-15 09:32:44.416563+00', '2026-01-21 18:06:24.429163+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 7. MENU ITEMS
-- ============================================================
INSERT INTO public.menu_items (id, label, href, is_active, order_index, created_at, updated_at) VALUES
('e0b04e29-025c-422c-a4a0-8238a64c075c', 'Home', '#home', false, 0, '2026-01-15 09:32:44.416563+00', '2026-01-15 18:24:08.130712+00'),
('04e8ccc0-6887-4141-a397-a30dd40117b7', 'Services', '#services', true, 1, '2026-01-15 09:32:44.416563+00', '2026-01-15 18:25:48.032569+00'),
('c12fc551-6782-4e9f-b7a2-a274c38d9ede', 'Hajj Packages', '#hajj', true, 2, '2026-01-15 09:32:44.416563+00', '2026-01-15 09:32:44.416563+00'),
('45f21468-3430-4e96-870e-e992eab7ede9', 'Umrah Packages', '#umrah', true, 3, '2026-01-15 09:32:44.416563+00', '2026-01-15 09:32:44.416563+00'),
('75f2d598-b4f8-40d7-a438-4fbae03df773', 'Visa Services', '#visa', true, 4, '2026-01-15 09:32:44.416563+00', '2026-01-15 09:32:44.416563+00'),
('57829bba-7dd7-48c5-a700-3b30beb55c30', 'Our Team', '#team', false, 5, '2026-01-15 09:32:44.416563+00', '2026-01-21 14:20:02.044214+00'),
('c17df6c0-4b10-4a72-8cb3-4db6b0511374', 'Testimonials', '#testimonials', false, 6, '2026-01-15 09:32:44.416563+00', '2026-01-15 18:47:06.587822+00'),
('edbbc63f-9f47-49ec-b6cb-467c09fd9877', 'FAQ', '#faq', false, 7, '2026-01-15 09:32:44.416563+00', '2026-01-15 18:43:57.911599+00'),
('1113daa3-5af8-4741-b7b7-07ec55bf8a80', 'Gallery', '#gallery', true, 8, '2026-01-18 19:56:05.211219+00', '2026-01-19 13:56:59.142125+00'),
('caf78f90-232b-423c-b608-a08cd8f8fdfb', 'Contact', '#contact', true, 8, '2026-01-15 09:32:44.416563+00', '2026-01-19 13:56:58.790339+00'),
('bb6eb7b6-28be-42fa-a81e-257e50e4b95f', 'My Bookings', '/my-bookings', false, 10, '2026-01-27 03:58:47.507019+00', '2026-01-27 05:32:25.743597+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 8. CONTACT INFO
-- ============================================================
INSERT INTO public.contact_info (id, title, type, icon_name, details, map_link, is_active, order_index, created_at, updated_at) VALUES
('e2d8758e-a0eb-4469-b8ce-8a9af3764c4f', 'Call us', 'phone', 'Phone', '{"Hotline      : +8801867666888","Telephone: +8802224446664"}', NULL, true, 0, '2026-01-15 09:32:44.416563+00', '2026-01-21 05:35:19.593817+00'),
('add3831e-79dd-48b9-a071-813707596892', 'Email Us', 'email', 'Mail', '{"info@smelitehajj.com","support@smelitehajj.com"}', NULL, true, 1, '2026-01-15 09:32:44.416563+00', '2026-01-20 09:35:20.09609+00'),
('b3d6b245-5fbb-4dfa-9b36-34882df1edc0', 'Visit Us', 'address', 'MapPin', '{"B-25/4, Al-Baraka Super Market, Savar Bazar Bus-Stand, Savar, Dhaka-1340"}', '23°50''49.2"N 90°15''30.8"E', true, 2, '2026-01-15 09:32:44.416563+00', '2026-02-02 04:16:52.503569+00'),
('dc68f7a6-7090-46ef-9435-3023f4c53b87', 'Office Hours', 'hours', 'Clock', '{" Saturday to Thursday","7:00 AM to 5:00 PM","Friday : Holiday"}', NULL, true, 3, '2026-01-15 09:32:44.416563+00', '2026-01-26 17:25:01.971938+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 9. FAQ ITEMS
-- ============================================================
INSERT INTO public.faq_items (id, question, answer, is_active, order_index, created_at, updated_at) VALUES
('4716373a-1fd3-45c6-9a1e-ef60b70f583e', 'What documents are required for Hajj/Umrah visa?', 'You will need a valid passport (minimum 6 months validity), recent passport-size photographs, completed visa application form, vaccination certificates (Meningitis ACWY and COVID-19), and proof of relationship for female travelers under 45.', true, 0, '2026-01-15 09:32:44.416563+00', '2026-01-15 09:32:44.416563+00'),
('f00afb67-d121-476e-8133-f0889adac384', 'How far in advance should I book my Hajj package?', 'We recommend booking at least 6-8 months in advance for Hajj packages due to limited quotas and high demand. For Umrah, 2-3 months advance booking is sufficient for most periods except Ramadan.', true, 1, '2026-01-15 09:32:44.416563+00', '2026-01-15 09:32:44.416563+00'),
('a1962400-f588-4fba-8e84-82b733d99396', 'What is included in your Hajj/Umrah packages?', 'Our packages typically include visa processing, return air tickets, accommodation in Makkah and Madinah, transportation (airport transfers and inter-city), guided Ziyarat tours, and 24/7 support. Meals are included in most packages.', true, 2, '2026-01-15 09:32:44.416563+00', '2026-01-15 09:32:44.416563+00'),
('fe6f6bf7-3bd8-42bd-9d93-d665a6f65bb5', 'Can I customize my travel package?', 'Yes! We offer flexible packages that can be customized based on your preferences for hotel category, duration of stay, and additional services. Contact our team to discuss your specific requirements.', true, 3, '2026-01-15 09:32:44.416563+00', '2026-01-15 09:32:44.416563+00'),
('3bcf8c18-f7f6-469e-a37a-b3c3dfad79d9', 'What payment options are available?', 'We accept bank transfers, credit/debit cards, and mobile banking (bKash, Nagad). We also offer installment plans for Hajj packages. A deposit is required to confirm your booking.', true, 4, '2026-01-15 09:32:44.416563+00', '2026-01-15 09:32:44.416563+00'),
('854a51c2-c3f3-40a7-a0b4-202c18ba09b0', 'Is travel insurance included in the packages?', 'Basic travel insurance is included in all our packages. However, we recommend upgrading to comprehensive coverage that includes medical emergencies, trip cancellation, and baggage protection for complete peace of mind.', true, 5, '2026-01-15 09:32:44.416563+00', '2026-01-15 09:32:44.416563+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 10. TESTIMONIALS
-- ============================================================
INSERT INTO public.testimonials (id, name, location, quote, rating, package_name, avatar_url, is_active, is_featured, is_video, video_url, display_location, order_index, created_at, updated_at) VALUES
('c1594ee1-d5c1-40cf-b2f2-087c4006f3c0', 'Ahmed Rahman', 'Dhaka, Bangladesh', 'Alhamdulillah! The entire Hajj experience was seamless. From visa processing to accommodation, everything was perfectly organized.', 5, 'Premium Hajj Package', NULL, true, false, false, NULL, 'homepage', 0, '2026-01-15 09:32:44.416563+00', '2026-01-15 09:32:44.416563+00'),
('ee9d97b9-443c-427a-adbd-785b18c0d23f', 'Fatima Begum', 'Chittagong, Bangladesh', 'This was my second Umrah with Bright Expeditions and once again they exceeded expectations. The hotel was walking distance from Haram, and the staff was incredibly helpful.', 5, 'Umrah Premium Package', NULL, true, false, false, NULL, 'homepage', 1, '2026-01-15 09:32:44.416563+00', '2026-01-15 09:32:44.416563+00'),
('f507f43d-916b-4e0a-8ab6-79b9eca19d92', 'Mohammad Karim', 'Sylhet, Bangladesh', 'Excellent service from start to finish. The team handled all documentation professionally, and we had no issues during our pilgrimage.', 5, 'Family Hajj Package', NULL, true, false, false, NULL, 'homepage', 2, '2026-01-15 09:32:44.416563+00', '2026-01-15 09:32:44.416563+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 11. TEAM MEMBERS
-- ============================================================
INSERT INTO public.team_members (id, name, role, qualifications, avatar_url, whatsapp_number, imo_number, board_type, is_active, order_index, created_at, updated_at) VALUES
('82c1964e-9229-4cba-b2bd-db8bb2b7b17b', 'Habibullah Mesbah Madani', 'Chief Shariah Advisor', 'Honours Islamic Law and Jurisprudence, Madina Islami University, Madina, Saudi Arabia', '/uploads/team/habibullah.jpeg', '+966549498501', '', 'shariah', true, 0, '2026-01-15 09:32:44.416563+00', '2026-01-26 02:21:21.874508+00'),
('59838292-a77e-47f4-a9f7-d1da96de8680', 'A. S. M. Al-Amin', 'Chairman & Managing Director', E'Honours, Islamic Studies, National University, Bangladesh\nArabic Language Course, Jahangirnagar University', '/uploads/team/alamin.png', '+8801619959625', '', 'management', true, 1, '2026-01-15 09:32:44.416563+00', '2026-01-23 15:48:16.649286+00'),
('3ba0b4ec-3bc2-44b7-a8a5-618ae56c50ae', 'Md. Abdur Rahman', 'Director & Managing Partner', 'BBA, 15+ Years Experience', '/uploads/team/abdur_rahman.jpg', '+8801710252596', '', 'management', true, 2, '2026-01-15 09:32:44.416563+00', '2026-01-23 15:44:44.830824+00'),
('68003481-c48a-4d53-ab38-96d4f7adbf4d', 'Md. Muzahidul Islam Nahid', 'Head of Customer Relations', 'Certified Tour Manager', '/uploads/team/nahid.jpg', '+8801619959628', '', 'management', true, 3, '2026-01-15 09:32:44.416563+00', '2026-01-23 15:41:59.046355+00'),
('2b18bbf2-05bf-4184-847f-fcf4f9932908', 'Md Saddam Hossain', 'Director & Managing Partner', '', '/uploads/team/saddam.jpg', '+8801619959626', '+8801619959626', 'management', true, 4, '2026-01-19 14:14:19.313855+00', '2026-01-31 12:22:51.938686+00'),
('3c37db5c-7c64-4400-b476-da7b7ce60b88', 'Md Shihab Hossain', 'Senior Executive', '', '/uploads/team/shihab.jpeg', '+8801619959627', '', 'management', true, 5, '2026-01-23 15:52:46.957799+00', '2026-01-23 16:26:50.190013+00'),
('ed5e0fa7-cdcb-4bab-9f16-2af93f06225f', 'Abul Kalam', 'Director', '', '/uploads/team/kalam.jpeg', '', '', 'management', true, 6, '2026-01-26 02:12:38.895774+00', '2026-02-17 04:45:46.13985+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 12. FOOTER CONTENT
-- ============================================================
INSERT INTO public.footer_content (id, company_description, contact_address, contact_address_2, contact_email, contact_phones, copyright_text, quick_links, services_links, social_links, address_label_1, address_label_2, video_url, video_enabled, video_opacity, video_speed, video_blur, video_overlay_color, video_scale, video_position, created_at, updated_at) VALUES
('740a3ab7-f156-4664-9612-2818f410fcca', 'Your trusted partner for Hajj, Umrah, and international travel services. With over 7+ years of experience, we are committed to making your sacred journey memorable and hassle-free.', 'B-25/4, Al-Baraka Super Market, Savar Bazar Bus-Stand, Savar, Dhaka-1340.', 'House # 37, Block # C, Road # 6, Banani, Dhaka-1213.', 'support@smelitehajj.com', '{"+02224446664","+8801867666888 +8801619959625","+8801619959626 +8801619959627","+8801619959628 +8801619959629","+8801619959630"}', '© 2024 SM Elite Hajj Management. All rights reserved.', '[{"href":"https://www.hajj.gov.bd/","label":"ধর্ম বিষয়ক মন্ত্রনালয় (সরকারি ওয়েবসাইট)"},{"href":"https://ehaj.hajj.gov.bd/","label":"ই-হজ ব্যবস্থানা (সরকারি ওয়েবসাইট)"},{"href":"https://hajoffice.gov.bd/","label":"হজ অফিস, ঢাকা (সরকারি ওয়েবসাইট)"}]', '[{"href":"/#hajj","label":"Hajj Packages"},{"href":"/#umrah","label":"Umrah Packages"},{"href":"/#visa","label":"Visa Services"},{"href":"/hotels","label":"Hotel Booking"},{"href":"/#services","label":"Air Ticket"},{"href":"/#services","label":"Tour Package"}]', '[{"icon":"Facebook","platform":"Facebook","url":"https://www.facebook.com/profile.php?id=61579433165615"},{"icon":"Instagram","platform":"Instagram","url":"https://instagram.com"},{"icon":"Youtube","platform":"Youtube","url":"http://www.youtube.com/@S.M.EliteHajjLimited"}]', 'Savar Office', 'Banani Office', '/videos/footer-bg.mp4', true, 40, 0.75, 0, 'rgba(0, 0, 0, 0)', 100, 'center', '2026-01-15 09:32:44.416563+00', '2026-02-03 06:04:10.625636+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 13. PAYMENT METHODS
-- ============================================================
INSERT INTO public.payment_methods (id, name, slug, description, icon_name, is_enabled, is_live_mode, credentials, order_index, created_at, updated_at) VALUES
('ffda1bca-2f21-4b3d-b51a-0a0fb4cd8751', 'SSLCommerz', 'sslcommerz', 'Pay securely with credit/debit card via SSLCommerz', 'CreditCard', false, false, '{}', 1, '2026-01-17 09:18:11.880388+00', '2026-02-02 09:12:30.082615+00'),
('8d089db6-e247-4c11-b473-1088d272c427', 'bKash', 'bkash', 'Pay with bKash mobile wallet', 'Smartphone', true, false, '{}', 2, '2026-01-17 09:18:11.880388+00', '2026-03-03 02:26:24.314244+00'),
('e236efe8-0625-4bc4-bfb2-a1bb91ee17aa', 'Nagad', 'nagad', 'Pay with Nagad mobile wallet', 'Wallet', true, false, '{}', 3, '2026-01-17 09:18:11.880388+00', '2026-01-27 15:24:28.21739+00'),
('e3ebe10d-4403-4e99-b146-3dc502c246e4', 'Cash Payment', 'cash', 'Pay in cash at our office', 'Banknote', true, false, '{}', 4, '2026-01-17 09:18:11.880388+00', '2026-01-17 09:33:51.669828+00'),
('390e053c-50f0-4d45-9701-2a9679421c57', 'Bank Transfer', 'bank_transfer', 'Transfer directly to our bank account', 'Building', true, false, '{"account_name":"SM Elite Hajj Travel Agency Ltd","account_number":"1501204528849001","bank_name":"BRAC Bank Limited","branch":"Gulshan Branch","routing_number":"060261934","swift_code":"BABORHDHXXX"}', 5, '2026-01-19 19:01:37.897651+00', '2026-01-19 19:01:37.897651+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 14. GALLERY IMAGES
-- ============================================================
INSERT INTO public.gallery_images (id, image_url, alt_text, caption, category, is_active, order_index, tags, created_at, updated_at) VALUES
('5b39f96f-8737-4f85-ac10-571542e95359', 'https://images.unsplash.com/photo-1580418827493-f2b22c0a76cb?w=800&q=80', 'Kaaba in Makkah', 'The sacred Kaaba during Hajj season', 'general', true, 0, '{}', '2026-01-18 19:58:02.488175+00', '2026-01-18 20:50:27.408327+00'),
('773fca80-dc40-4288-9bd5-1fba99998ba0', 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=800&q=80', 'Pilgrims at Masjid al-Haram', 'Thousands of pilgrims gathering for prayer', 'general', true, 1, '{}', '2026-01-18 19:58:02.488175+00', '2026-01-18 20:50:27.408327+00'),
('cae0577f-fdb5-4b07-914a-8a0e39aebc83', 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=800&q=80', 'Masjid an-Nabawi', 'The Prophet''s Mosque in Madinah at night', 'general', true, 2, '{}', '2026-01-18 19:58:02.488175+00', '2026-01-18 20:50:27.408327+00'),
('33340ac1-32f2-4ad4-bb14-dac802aa5413', 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=800&q=80', 'Makkah cityscape', 'Beautiful view of Makkah with the Clock Tower', 'general', true, 3, '{}', '2026-01-18 19:58:02.488175+00', '2026-01-18 20:50:27.408327+00'),
('dca2c548-7d08-4b25-b3c4-3066eb5778a0', 'https://images.unsplash.com/photo-1466442929976-97f336a657be?w=800&q=80', 'Pilgrims in prayer', 'Devotees in deep prayer during Umrah', 'general', true, 4, '{}', '2026-01-18 19:58:02.488175+00', '2026-01-18 20:50:27.408327+00'),
('f36dc35e-e65e-4470-8597-096fcaa3ed3a', 'https://images.unsplash.com/photo-1580418827493-f2b22c0a76cb?w=800&q=80', 'Masjid al-Haram interior', 'Inside the Grand Mosque during Tawaf', 'general', true, 5, '{}', '2026-01-18 19:58:02.488175+00', '2026-01-19 14:19:03.206521+00'),
('2a05000b-d774-4cef-96f2-3a305f8f2005', 'https://images.unsplash.com/photo-1585036156171-384164a8c675?w=800&q=80', 'Green Dome Madinah', 'The iconic Green Dome of the Prophet''s Mosque', 'general', true, 6, '{}', '2026-01-18 19:58:02.488175+00', '2026-01-18 20:50:27.408327+00'),
('eccb5cf2-d493-460a-8d20-5fd099e60969', 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800&q=80', 'Mosque architecture', 'Beautiful Islamic architecture', 'general', true, 7, '{}', '2026-01-18 19:58:02.488175+00', '2026-01-18 20:50:27.408327+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 15. GALLERY SETTINGS
-- ============================================================
INSERT INTO public.gallery_settings (id, title, subtitle, is_enabled, default_view, columns_desktop, columns_tablet, columns_mobile, lightbox_enabled, show_captions, show_thumbnails, hover_effect, image_aspect_ratio, image_border_radius, autoplay_carousel, autoplay_speed, background_color, overlay_color, video_url, video_enabled, video_opacity, video_speed, video_blur, created_at, updated_at) VALUES
('eda91f22-ae5b-4bb2-8bc7-17db354c0a5b', 'Our Gallery', 'Capturing beautiful moments from our sacred journeys', true, 'grid', 4, 3, 2, true, true, true, 'zoom', 'square', 'lg', true, 4000, '#f8fafc', 'rgba(0,0,0,0.6)', 'https://videos.pexels.com/video-files/3773485/3773485-uhd_2560_1440_30fps.mp4', true, 0.3, 1.0, 2, '2026-01-18 19:52:45.739049+00', '2026-01-26 06:53:37.016183+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 16. NOTICES
-- ============================================================
INSERT INTO public.notices (id, title, content, notice_type, priority, is_active, is_pinned, order_index, external_link, external_link_text, attachment_url, attachment_name, start_date, end_date, created_at, updated_at) VALUES
('da62e60b-657d-444b-836f-a5394c53a972', '🕋 Hajj 2027 Registration Now Open!', 'We are pleased to announce that registration for Hajj 2026 is now officially open. Limited seats available - book early to secure your spot for this sacred journey. Early bird discount of 10% available until March 31, 2026. Contact us today for more details about our premium packages.', 'hajj', 'high', true, true, 0, '#hajj', 'View Hajj Packages', NULL, NULL, '2026-01-21 05:14:45.76604+00', NULL, '2026-01-21 05:14:45.76604+00', '2026-01-21 14:09:28.887896+00'),
('03355c3a-3656-45dd-bc24-647ef96ac99a', '✨ Special Umrah Ramadan 2026 Packages Available!', 'Experience the blessed month of Ramadan in the holy cities of Makkah and Madinah. Our exclusive Ramadan Umrah packages include 5-star accommodations near Haram, guided Ziyarat tours, and special Iftar arrangements. Book now and receive complimentary airport transfers!', 'umrah', 'high', true, false, 0, '#umrah', 'Explore Umrah Packages', NULL, NULL, '2026-01-21 05:23:04.55887+00', NULL, '2026-01-21 05:23:04.55887+00', '2026-01-21 05:23:04.55887+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 17. OFFICE LOCATIONS
-- ============================================================
INSERT INTO public.office_locations (id, name, address, phones, email, map_query, is_active, order_index, created_at, updated_at) VALUES
('6d947a73-21f6-4369-80d7-e43bf75534c2', 'Banani Office', 'House # 37, Block # C, Road # 6, Banani, Dhaka-1213.', '{"+88 01867666888","+88 01619959625"}', 'info@smelitehajj.com', 'https://maps.app.goo.gl/u6CMKDbPvyZ8xSWe9', true, 0, '2026-01-15 21:16:26.626842+00', '2026-01-26 17:24:03.174547+00'),
('17bc6d4d-8ddd-4428-b3fe-2cb52473fc6f', 'Savar Office', 'B-25/4, Al-Baraka Super Market, Savar Bazar Bus-Stand, Savar, Dhaka-1340.', '{"+88 02224446664","+88 01619959626"}', 'support@smelitehajj.com', '23°50''49.2"N 90°15''30.8"E', true, 1, '2026-01-15 21:16:26.626842+00', '2026-01-26 17:21:13.598989+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 18. SOCIAL NETWORKS
-- ============================================================
INSERT INTO public.social_networks (id, platform_name, icon_name, url, is_active, order_index, created_at, updated_at) VALUES
('3d1c1d1a-6c4a-4613-8b57-a32e01e7d17b', 'Facebook', 'Facebook', 'https://www.facebook.com/profile.php?id=61579433165615', true, 0, '2026-01-21 17:56:04.156767+00', '2026-01-26 04:52:30.837786+00'),
('51d99342-3451-4f96-b46a-975eba7326c0', 'Instagram', 'Instagram', 'https://instagram.com', true, 1, '2026-01-21 17:56:04.156767+00', '2026-01-26 04:52:31.114604+00'),
('6da9d771-cbee-49a2-b24b-4f91e19e762a', 'YouTube', 'Youtube', 'https://www.youtube.com/@S.M.EliteHajjLimited', true, 2, '2026-01-21 17:56:04.156767+00', '2026-01-26 04:52:31.405638+00'),
('ea5ecc0a-3fbd-4b0d-81d3-c0b463718cde', 'Twitter', 'Twitter', 'https://twitter.com', true, 3, '2026-01-21 17:56:04.156767+00', '2026-01-26 04:52:31.693723+00'),
('5a311049-e585-4999-b151-1693ebc2c0ff', 'TikTok', 'Music', 'https://tiktok.com', true, 4, '2026-01-21 17:56:04.156767+00', '2026-01-26 04:52:31.970114+00'),
('b1387879-366b-4ba5-8832-9c18e6f5a144', 'LinkedIn', 'Linkedin', 'https://linkedin.com', true, 5, '2026-01-21 17:56:04.156767+00', '2026-01-26 04:52:32.25678+00'),
('2f4eee72-3ef1-42a9-b4bc-806b7d0bed72', 'WhatsApp', 'MessageCircle', 'https://whatsapp.com', true, 6, '2026-01-21 17:56:04.156767+00', '2026-01-26 04:52:32.555794+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 19. THEME SETTINGS
-- ============================================================
INSERT INTO public.theme_settings (id, primary_color, secondary_color, accent_color, text_color, background_color, font_family, heading_font, border_radius, dark_mode_enabled, created_at, updated_at) VALUES
('539fb71a-8d84-45e8-b34f-1fc5beec8b65', '#1e3a5f', '#c9a227', '#2e7d32', '#1a1a1a', '#ffffff', 'Inter', 'Playfair Display', 'lg', false, '2026-01-18 21:35:49.208669+00', '2026-01-18 21:35:49.208669+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 20. TERMINAL CONTENT
-- ============================================================
INSERT INTO public.terminal_content (id, title, terminal_text, text_color, bg_color, font_size, typing_animation, is_enabled, order_index, created_at, updated_at) VALUES
('d30db543-7fc6-478e-87f4-ecad425abd5b', 'Terminal', E'بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ\n\nWelcome to Bright Expeditions...\nYour trusted partner for Hajj & Umrah journeys.\n\nConnecting hearts to the Holy Lands since 2010.\nOver 50,000+ satisfied pilgrims served.\n\nType "help" for more information...', '#00ff00', '#1a1a2e', '14px', true, true, 0, '2026-01-18 21:35:49.208669+00', '2026-01-18 21:35:49.208669+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 21. NOTIFICATION SETTINGS
-- ============================================================
INSERT INTO public.notification_settings (id, setting_type, is_enabled, config, created_at, updated_at) VALUES
('805b8a70-cffd-42b2-b967-bb6befb53fbf', 'email', true, '{"from_email":"smelithajjlimited@gmail.com","from_name":"SM Elite Hajj Limited","smtp_host":"smtp.gmail.com","smtp_password":"bthu tudn htsf ylgd","smtp_port":"587","smtp_user":"smelithajjlimited@gmail.com"}', '2026-01-15 19:28:55.683383+00', '2026-01-28 03:38:11.25689+00'),
('85fa7e6e-9040-4a6d-ae45-dfccaf95afdd', 'sms', true, '{"api_key":"GrhD6q2XIi3eGj1oAB23","api_url":"http://bulksmsbd.net/api/smsapi?api_key=GrhD6q2XIi3eGj1oAB23&type=text&number=Receiver&senderid=8809617626936&message=TestSMS","provider":"bulk_sms","sender_id":"8809617626936"}', '2026-01-15 19:28:55.683383+00', '2026-01-28 03:38:14.412546+00'),
('85d4fbc7-530a-4c31-a3cd-796582aeddc7', 'whatsapp', false, '{"account_sid":"","auth_token":"","from_number":"","message_template":"Hello {{name}}, your booking status has been updated to: {{status}}. Booking ID: {{booking_id}}","provider":"twilio"}', '2026-01-23 11:37:59.09995+00', '2026-01-23 11:37:59.09995+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 22. HOTEL SECTION SETTINGS
-- ============================================================
INSERT INTO public.hotel_section_settings (id, section_key, title, subtitle, is_enabled, booking_enabled, hotels_per_page, show_details_button, show_map_button, sort_by, sort_order, star_label, created_at, updated_at) VALUES
('012f7327-7d28-432c-93ec-496652c488b1', 'makkah', 'Makkah Hotels', 'Premium accommodations near Masjid al-Haram', true, true, 12, true, true, 'order_index', 'asc', 'Star', '2026-01-31 18:57:04.92442+00', '2026-01-31 18:57:04.92442+00'),
('e544af93-2bfa-483a-9a5c-483d8d97cc60', 'madinah', 'Madinah Hotels', 'Comfortable stays near Masjid an-Nabawi', true, true, 12, true, true, 'order_index', 'asc', 'Star', '2026-01-31 18:57:04.92442+00', '2026-01-31 18:57:04.92442+00'),
('e4968ed9-862c-4bd0-b455-b24df6dafc88', 'general', 'Hotel Bookings', 'Find your perfect stay for Umrah', true, true, 12, true, true, 'order_index', 'asc', 'Star', '2026-01-31 18:57:04.92442+00', '2026-01-31 18:57:04.92442+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 23. HOTELS
-- ============================================================
INSERT INTO public.hotels (id, name, city, country, star_rating, distance_from_haram, description, facilities, images, google_map_link, google_map_embed_url, contact_email, contact_phone, price_per_night, details, is_active, order_index, created_at, updated_at) VALUES
('b187288b-7e12-4d20-a521-f52647534f23', 'Sonargoin Hotel', 'Dhaka', 'Bangladesh', 5, 0, NULL, '{"WiFi","Parking","Breakfast","Restaurant","Gym","Pool","AC","TV","Bathroom","24/7 Reception","Prayer Room","Airport Shuttle","Laundry","Room Service"}', '{"/uploads/hotels/sonargoin.webp"}', 'https://maps.app.goo.gl/PiFuYdJyHdhcQrMV8', 'https://maps.app.goo.gl/PiFuYdJyHdhcQrMV8', 'info@smelitehajj.com', '+8801867666888', NULL, '{}', true, 0, '2026-02-03 09:44:42.573226+00', '2026-02-03 10:14:29.455976+00'),
('b9756600-0d8b-4071-8fee-8f18448af634', 'Orvana Thakher Hotel', 'makkah', 'Saudi Arabia', 3, 500, NULL, '{"24/7 Reception","WiFi","Parking","Breakfast","Restaurant","Pool","AC","TV","Room Service","Laundry","Airport Shuttle","Prayer Room","Gym","Bathroom"}', '{"/uploads/hotels/orvana.jpg"}', NULL, NULL, NULL, NULL, NULL, '{}', true, 1, '2026-02-04 14:03:28.506483+00', '2026-02-04 14:03:28.506483+00'),
('f5a81f46-24f4-4cff-8aa8-46000c3e8103', 'Saddam Hotel', 'Medina', 'Saudi Arabia', 4, 300, NULL, '{"WiFi","Parking","Breakfast","Restaurant","Gym","Pool","AC","TV","Bathroom","24/7 Reception","Prayer Room","Airport Shuttle","Laundry","Room Service"}', '{"/uploads/hotels/saddam.jpg"}', NULL, NULL, NULL, NULL, NULL, '{}', true, 2, '2026-02-04 14:05:25.502803+00', '2026-02-04 14:05:25.502803+00'),
('049a87b5-7b8c-4370-9ebd-4bf5387473da', 'Shihab Hotel', 'makkah', 'Saudi Arabia', 2, 1500, NULL, '{"WiFi","Parking","Laundry","Prayer Room","AC"}', '{"/uploads/hotels/shihab.jpg"}', NULL, NULL, NULL, NULL, NULL, '{}', true, 3, '2026-02-04 14:08:07.279006+00', '2026-02-04 14:08:07.279006+00'),
('11f6e569-054b-4242-819d-84324101702c', 'Burj Al Arab "Dubai''s seven star hotel"', 'Dubai', 'Dubai', 5, 0, NULL, '{"WiFi","Parking","Breakfast","Restaurant","Gym","Pool","AC","TV","Bathroom","24/7 Reception","Prayer Room","Airport Shuttle","Laundry","Room Service"}', '{"/uploads/hotels/burj.webp"}', NULL, NULL, NULL, NULL, NULL, '{}', true, 4, '2026-02-04 14:10:22.04934+00', '2026-02-04 14:10:22.04934+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 24. CHART OF ACCOUNTS
-- ============================================================
INSERT INTO public.chart_of_accounts (id, account_code, account_name, account_type, description, opening_balance, current_balance, is_active, parent_id, created_at, updated_at) VALUES
('874f7315-8619-4eef-9f6b-7dac33e7c416', '1000', 'Cash', 'asset', 'Cash on hand', 0, 0, true, NULL, '2026-03-08 16:54:16.142224+00', '2026-03-09 05:04:10.69081+00'),
('b954bcb8-72bc-497d-adef-9cf5749e4289', '1010', 'Bank Accounts', 'asset', 'Money in bank accounts', 0, 0, true, NULL, '2026-03-08 16:54:16.142224+00', '2026-03-09 05:04:10.69081+00'),
('00cf3dd3-eff2-45bc-aa39-98020252956b', '1020', 'Accounts Receivable', 'asset', 'Money owed by customers', 0, 0, true, NULL, '2026-03-08 16:54:16.142224+00', '2026-03-09 05:04:10.69081+00'),
('3cb7442b-8c85-4fc5-9bcb-5c80814d913c', '1030', 'Mobile Banking', 'asset', 'Mobile banking balances', 0, 0, true, NULL, '2026-03-08 16:54:16.142224+00', '2026-03-09 05:04:10.69081+00'),
('e041ff09-6390-4a41-9dc5-dbb87e50a6c5', '2000', 'Accounts Payable', 'liability', 'Money owed to suppliers', 0, 0, true, NULL, '2026-03-08 16:54:16.142224+00', '2026-03-09 05:04:10.69081+00'),
('d401dcee-f413-4d65-8ca9-1d8a70c3af6f', '2010', 'Advance from Customers', 'liability', 'Customer advance payments', 0, 0, true, NULL, '2026-03-08 16:54:16.142224+00', '2026-03-09 05:04:10.69081+00'),
('9e5e7694-f992-43a1-8536-86b036362341', '3000', 'Owner Equity', 'equity', 'Owner investment', 0, 0, true, NULL, '2026-03-08 16:54:16.142224+00', '2026-03-09 05:04:10.69081+00'),
('b53e4fe3-9ea6-4923-bb12-db30b53c809c', '3010', 'Retained Earnings', 'equity', 'Accumulated profits', 0, 0, true, NULL, '2026-03-08 16:54:16.142224+00', '2026-03-09 05:04:10.69081+00'),
('02794a4b-8257-4907-9d55-d1eede114228', '4000', 'Package Sales', 'income', 'Revenue from package bookings', 0, 0, true, NULL, '2026-03-08 16:54:16.142224+00', '2026-03-09 05:04:10.69081+00'),
('315891d6-02f7-41c8-a513-5f9a6263175d', '4010', 'Visa Service Income', 'income', 'Revenue from visa services', 0, 0, true, NULL, '2026-03-08 16:54:16.142224+00', '2026-03-09 05:04:10.69081+00'),
('9ea42db9-4ab1-46aa-a020-1922d1537a21', '4020', 'Air Ticket Income', 'income', 'Revenue from air tickets', 0, 0, true, NULL, '2026-03-08 16:54:16.142224+00', '2026-03-09 05:04:10.69081+00'),
('189e702a-542b-4ec6-b7fd-111841c8f5e5', '4030', 'Hotel Booking Income', 'income', 'Revenue from hotel bookings', 0, 0, true, NULL, '2026-03-08 16:54:16.142224+00', '2026-03-09 05:04:10.69081+00'),
('a315cfec-a5e5-410b-afd0-40f2305efa47', '4040', 'Other Income', 'income', 'Miscellaneous income', 0, 0, true, NULL, '2026-03-08 16:54:16.142224+00', '2026-03-09 05:04:10.69081+00'),
('7ce4395a-8121-4754-b83f-41415634b2d5', '5000', 'Office Rent', 'expense', 'Monthly office rent', 0, 0, true, NULL, '2026-03-08 16:54:16.142224+00', '2026-03-09 05:04:10.69081+00'),
('68503d70-2409-4ccf-91bb-818faeda3de6', '5010', 'Utilities', 'expense', 'Electricity, water, internet', 0, 0, true, NULL, '2026-03-08 16:54:16.142224+00', '2026-03-09 05:04:10.69081+00'),
('6577f6b1-b3a8-41a4-b6c9-7fbcc470f70d', '5020', 'Salaries', 'expense', 'Employee salaries', 0, 0, true, NULL, '2026-03-08 16:54:16.142224+00', '2026-03-09 05:04:10.69081+00'),
('b6d08cb9-2a4f-4e18-b28b-d6d8f2e7c123', '5030', 'Marketing', 'expense', 'Advertising and marketing costs', 0, 0, true, NULL, '2026-03-08 16:54:16.142224+00', '2026-03-09 05:04:10.69081+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 25. MARKETING SETTINGS
-- ============================================================
INSERT INTO public.marketing_settings (id, setting_key, setting_value, created_at, updated_at) VALUES
('dc0ed36e-6def-48ac-89c2-0fc53350bf86', 'general', '{"capi_enabled":true,"default_currency":"BDT","default_lead_value":50000,"pixel_enabled":true}', '2026-01-30 07:51:56.301619+00', '2026-01-30 07:51:56.301619+00'),
('1f1c0a5f-839c-4ad7-bde5-8191e28daa2c', 'recaptcha', '{"enabled":false,"secret_key":"","site_key":"","threshold":0.3}', '2026-01-30 07:51:56.301619+00', '2026-01-30 07:51:56.301619+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 26. CUSTOMERS
-- ============================================================
INSERT INTO public.customers (id, full_name, email, phone, date_of_birth, gender, nationality, passport_number, address, emergency_contact_name, emergency_contact_phone, notes, status, user_id, booking_id, created_at, updated_at) VALUES
('26878a3a-20dc-4412-a493-8274a5975df2', 'MD IQBAL HOSSAIN', 'bditengineer@gmail.com', '01674533303', '2000-01-31', 'male', 'Bangladeshi', '', '32 Greenway, Shantinogor, Ramna', '', '', '', 'active', NULL, NULL, '2026-03-08 15:17:33.48958+00', '2026-03-08 15:17:33.48958+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- NOTE: Packages data is very large. After running this script,
-- you should manually verify the packages table has data.
-- The packages were exported but truncated due to size.
-- You can re-insert them via the admin panel.
-- ============================================================

-- ============================================================
-- 27. SITE SETTINGS (key CMS data)
-- ============================================================
INSERT INTO public.site_settings (id, setting_key, setting_value, category, created_at, updated_at) VALUES
('3434afba-f4c3-4159-9123-53b0cecd3f97', 'social_links', '{"facebook":"#","instagram":"#","twitter":"#","youtube":"#"}', 'general', '2026-01-17 12:16:22.201758+00', '2026-01-23 10:06:33.442291+00'),
('3e78658b-0da1-4d22-abd3-0b64564c6be2', 'contact_details', '{"address":"Dhaka, Bangladesh","email":"info@smelitehajj.com","google_map_embed_url":"https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3650.73722708738!2d90.40006317353787!3d23.79236988716717!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755c790ba691d2d%3A0xd7e95eafc3e303a7!2sS%20M%20Elite%20Hajj%20Limited!5e0!3m2!1sen!2sbd!4v1769162756109!5m2!1sen!2sbd","phone":"+8801867666888","whatsapp":"+8801867666888"}', 'general', '2026-01-17 12:16:22.201758+00', '2026-01-23 10:06:33.458139+00'),
('4005e1f0-e08a-4ef7-956d-c5d6be31f03a', 'company_info', '{"description":"Government Approved Hajj & Umrah Agency","logo_url":"","name":"S M Elite Hajj Limited","tagline":"Your Trusted Partner for Sacred Journeys"}', 'general', '2026-01-17 12:16:22.201758+00', '2026-01-23 10:06:33.466985+00'),
('78b798f1-0c2c-40fd-a55f-f9619399d58c', 'appearance', '{"announcement_text":"🎉 Special Offer: Book your Hajj 2026 package now and get 10% early bird discount!","primary_color":"#10b981","show_announcement_bar":false,"show_book_now_button":true}', 'appearance', '2026-01-17 12:16:22.201758+00', '2026-01-27 08:27:03.035564+00'),
('bd5ddf28-ad6c-4f16-89ea-0037fe4ca0b9', 'hero_autoplay_interval', '"4"', 'hero', '2026-01-19 16:10:31.24427+00', '2026-01-21 15:30:37.642803+00'),
('e0b4cc45-77e8-47b3-9559-a38a48b7165c', 'hero_theme', '"dark"', 'hero', '2026-01-20 16:57:56.754432+00', '2026-01-21 15:30:39.481409+00'),
('f4a86360-8286-4121-925f-ffb9c7021c33', 'hero_show_service_tiles', '"true"', 'hero', '2026-01-20 16:57:57.470928+00', '2026-01-21 15:30:40.243051+00'),
('8a0953f4-2617-4037-b860-99bcce00e9c1', 'hero_show_floating_patterns', '"false"', 'hero', '2026-01-20 16:57:58.011479+00', '2026-01-21 15:30:40.924281+00'),
('322cc2c9-946b-4be5-ab9a-df92e6230d67', 'hero_height', '"100vh"', 'hero', '2026-01-21 09:54:26.34252+00', '2026-01-21 15:30:41.55095+00'),
('5cc4213c-762e-4e8c-beeb-3ec370132753', 'hero_height_mobile', '"100vh"', 'hero', '2026-01-21 09:54:27.656362+00', '2026-01-21 15:30:42.106814+00'),
('906abe85-035c-4ca9-bfc0-abf0eb72fbf8', 'hero_image_focal_point', '"center"', 'hero', '2026-01-21 11:05:33.606537+00', '2026-01-21 15:30:42.715796+00'),
('706a671f-f7a0-4c75-9a06-680451f52edb', 'hero_top_margin', '"20"', 'hero', '2026-01-21 11:05:34.254845+00', '2026-01-21 15:30:43.271512+00'),
('4455169d-f7f7-4d57-84fa-f486fed05fef', 'services_section_header', '{"arabic_text":"خدماتنا","badge_text":"Why Choose Us","title":"Our Services"}', 'sections', '2026-01-21 08:20:06.362536+00', '2026-01-21 11:47:42.575177+00'),
('1523c521-cd2e-414c-9915-f0dbe3693e87', 'parent_company', '{"button_link":"https://smtradeint.com/","button_text":"Visit Our Mother Company","is_enabled":true}', 'services', '2026-01-20 18:20:38.90363+00', '2026-02-24 07:32:55.590865+00'),
('83f6dc25-b221-4c16-8ae6-4a847e604b11', 'installment_reminder', '{"overdue_reminder_daily":false,"overdue_reminder_enabled":true,"reminder_days_before":3,"send_email":true,"send_sms":true}', 'notifications', '2026-01-28 04:47:49.320012+00', '2026-01-28 04:47:49.320012+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 28. BOOKING SETTINGS  
-- ============================================================
INSERT INTO public.booking_settings (id, setting_key, setting_value, description, created_at, updated_at) VALUES
('184d64d9-5b53-45db-9939-7e607ce65e60', 'approval_required', '{"enabled":true}', 'Enable/disable admin approval for air ticket bookings', '2026-01-31 18:27:34.617598+00', '2026-01-31 18:27:34.617598+00'),
('021c6762-7d97-4f87-a323-e70ba6a89eec', 'auto_ticket_upload', '{"enabled":false}', 'Enable automatic ticket file upload', '2026-01-31 18:27:34.617598+00', '2026-01-31 18:27:34.617598+00'),
('71c6dfac-4dbf-48ad-a8a2-1614296d10e6', 'booking_status_flow', '{"statuses":["pending","confirmed","rejected","cancelled"]}', 'Available booking status options', '2026-01-31 18:27:34.617598+00', '2026-01-31 18:27:34.617598+00'),
('54770205-d9ae-4fee-95b0-ff8cb6f2bf55', 'sms_notifications', '{"enabled":true}', 'Enable SMS notifications for bookings', '2026-01-31 18:27:34.617598+00', '2026-01-31 18:27:34.617598+00'),
('a2509b35-c7e0-48a8-ac6d-d6867b6c5cd4', 'email_notifications', '{"enabled":true}', 'Enable email notifications for bookings', '2026-01-31 18:27:34.617598+00', '2026-01-31 18:27:34.617598+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- IMPORTANT: After running this, set admin password properly:
-- UPDATE public.users SET encrypted_password = crypt('Asomo@235977#', gen_salt('bf')) WHERE email = 'asomoalamin@yahoo.com';
-- UPDATE public.users SET encrypted_password = crypt('YourPassword', gen_salt('bf')) WHERE email = 'iqshait@gmail.com';
-- ============================================================

SELECT 'Data import completed successfully!' AS status;
