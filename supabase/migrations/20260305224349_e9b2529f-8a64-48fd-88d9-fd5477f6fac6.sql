
-- Fix typo and add description/includes for "Hajj Pacakge" (৳13,000)
UPDATE public.packages 
SET 
  title = 'Economy Hajj Package',
  description = 'Affordable Hajj package with essential services for a comfortable and blessed journey. Ideal for budget-conscious pilgrims seeking a meaningful Hajj experience.',
  includes = ARRAY[
    '❖ Return Air Ticket (economy class)',
    '❖ Shared accommodation in Makkah',
    '❖ Shared accommodation in Madinah',
    '❖ Saudi Muallem (Mina, Arafah & Muzdalifah)',
    '❖ Daily meals (breakfast, lunch & dinner)',
    '❖ Shared AC Bus Transportation for all routes',
    '❖ Guided Ziyarah tour to sacred landmarks',
    '❖ Islamic scholar guidance throughout the journey',
    '❖ Hajj training session before departure',
    '❖ 24/7 on-ground support team'
  ]
WHERE id = 'ec517b8b-6010-401e-89ca-88980fa98d36';

-- Add description/includes for "Hajj package" (৳120,000)
UPDATE public.packages 
SET 
  title = 'Standard Hajj Package',
  description = 'Comprehensive Hajj package with quality hotel accommodations near Haram, nutritious meals, and reliable transportation. A balanced choice for a fulfilling pilgrimage.',
  includes = ARRAY[
    '❖ Return Air Ticket on Saudi Airlines or Biman Bangladesh (economy class)',
    '❖ 5-Star hotel accommodation in Makkah (near Haram)',
    '❖ 5-Star hotel accommodation in Madinah (near Masjid An-Nabawi)',
    '❖ Saudi Muallem (Mina, Arafah Tent & Muzdalifah, Mashaer)',
    '❖ Daily meals (breakfast + lunch + dinner)',
    '❖ All meals during Hajj period in Mina and Arafah',
    '❖ Shared AC Bus Transportation for all routes',
    '❖ Dedicated buses for Mina, Arafah & Muzdalifah',
    '❖ Guided Ziyarah tour to sacred landmarks of Makkah & Madinah',
    '❖ Renowned Islamic scholars as journey guides',
    '❖ Hajj training and orientation before departure',
    '❖ 24/7 on-ground support and assistance'
  ]
WHERE id = 'f7c03077-1236-4712-9fa4-2e9bec7d544b';
