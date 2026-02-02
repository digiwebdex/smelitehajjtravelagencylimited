
# Offer Popup System Implementation Plan

## Overview
Create a fully customizable promotional popup that displays when visitors first enter the website. The popup will feature eye-catching Hajj/Umrah exclusive offers with complete admin control over content, styling, and enable/disable functionality.

---

## Feature Summary

### Frontend Popup Component
- **Eye-catching modal design** with animated entrance
- **Rich content support**: Title, subtitle, description, image/banner, CTA button
- **Smart display logic**: Shows only once per session (using localStorage)
- **Delay option**: Configurable delay before popup appears
- **Dismissible**: Close button and click-outside-to-close functionality
- **Responsive design**: Works seamlessly on mobile and desktop

### Admin Management Panel
- **Enable/Disable toggle**: Quickly turn the popup on or off
- **Content editing**: All text fields, images, and links are editable
- **Display settings**: Control timing, animation, and frequency
- **Preview capability**: See changes before publishing

---

## Technical Implementation

### 1. Database Schema
Create a new `offer_popup_settings` entry in `site_settings` table:

```text
Key: offer_popup
Category: marketing

Value Structure (JSON):
├── is_enabled: boolean
├── title: string (e.g., "Exclusive Hajj Offer!")
├── subtitle: string (e.g., "Limited Time Only")
├── description: string
├── image_url: string (banner image)
├── button_text: string (e.g., "Book Now")
├── button_link: string (e.g., "#hajj")
├── badge_text: string (e.g., "🔥 Special Offer")
├── discount_text: string (e.g., "Save up to 20%")
├── display_delay_seconds: number (default: 2)
├── show_once_per_session: boolean (default: true)
├── background_color: string
├── text_color: string
└── overlay_opacity: number (0-100)
```

### 2. New Components

#### `OfferPopup.tsx` (Frontend Popup)
```text
Location: src/components/OfferPopup.tsx

Features:
├── Fetches settings from site_settings table
├── Uses Dialog component from shadcn/ui
├── Animated entrance with framer-motion
├── Checks localStorage for session tracking
├── Configurable display delay
├── Eye-catching gradient backgrounds
├── Responsive image display
├── CTA button with configurable link
└── Close button and overlay click dismiss
```

#### `AdminOfferPopup.tsx` (Admin Panel)
```text
Location: src/components/admin/AdminOfferPopup.tsx

Features:
├── Master enable/disable toggle (prominent at top)
├── Content section:
│   ├── Title input
│   ├── Subtitle input
│   ├── Description textarea
│   ├── Badge text input
│   └── Discount text input
├── Media section:
│   └── Image upload with ImageUpload component
├── CTA section:
│   ├── Button text input
│   └── Button link input (with section shortcuts)
├── Display settings:
│   ├── Delay before showing (seconds slider)
│   ├── Show once per session toggle
│   └── Background/text color pickers
├── Live preview panel
└── Save button with loading state
```

### 3. Integration Points

#### Index Page (`src/pages/Index.tsx`)
- Add `OfferPopup` component as the first child after `<Header />`
- Uses Suspense for lazy loading (non-blocking)

#### Admin Sidebar (`src/components/admin/AdminSidebar.tsx`)
- Add "Offer Popup" under "Marketing & Leads" category
- Icon: `Gift` or `Megaphone`

#### Admin Dashboard (`src/pages/admin/AdminDashboard.tsx`)
- Import and register `AdminOfferPopup` component
- Add case for "offer-popup" in `renderContent()` switch

#### Admin Mobile Nav (`src/components/admin/AdminMobileNav.tsx`)
- Add "Offer Popup" entry under Marketing category

---

## Popup Design Mockup

```text
┌─────────────────────────────────────────────────┐
│  ╔═══════════════════════════════════════════╗  │
│  ║  [X Close]                                ║  │
│  ║                                           ║  │
│  ║     🔥 Special Offer                      ║  │
│  ║                                           ║  │
│  ║  ┌─────────────────────────────────────┐  ║  │
│  ║  │                                     │  ║  │
│  ║  │     [Hajj/Umrah Banner Image]       │  ║  │
│  ║  │                                     │  ║  │
│  ║  └─────────────────────────────────────┘  ║  │
│  ║                                           ║  │
│  ║     ✨ Exclusive Hajj Offer! ✨           ║  │
│  ║                                           ║  │
│  ║     Limited Time Only                     ║  │
│  ║                                           ║  │
│  ║     Book your sacred journey now and     ║  │
│  ║     save up to 20% on all packages!      ║  │
│  ║                                           ║  │
│  ║           Save up to 20%                  ║  │
│  ║                                           ║  │
│  ║       ┌─────────────────────┐            ║  │
│  ║       │    BOOK NOW  →      │            ║  │
│  ║       └─────────────────────┘            ║  │
│  ║                                           ║  │
│  ╚═══════════════════════════════════════════╝  │
│                                                 │
│            (Dark Overlay Background)            │
└─────────────────────────────────────────────────┘
```

---

## Admin Panel Layout

```text
┌─────────────────────────────────────────────────────────┐
│  📣 Offer Popup Settings                                │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  🟢 Enable Offer Popup                    [ON]   │   │
│  │  Show promotional popup to new visitors          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ Content ───────────────────────────────────────┐   │
│  │  Title:     [Exclusive Hajj Offer!          ]   │   │
│  │  Subtitle:  [Limited Time Only              ]   │   │
│  │  Badge:     [🔥 Special Offer               ]   │   │
│  │  Discount:  [Save up to 20%                 ]   │   │
│  │  Description: [Book your sacred journey...  ]   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ Banner Image ──────────────────────────────────┐   │
│  │  [Upload Image] [URL Input Field            ]   │   │
│  │  ┌─────────────────────────────────────────┐    │   │
│  │  │         Image Preview Area              │    │   │
│  │  └─────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ Call to Action ────────────────────────────────┐   │
│  │  Button Text: [Book Now                     ]   │   │
│  │  Button Link: [#hajj      ▼ Quick Links     ]   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ Display Settings ──────────────────────────────┐   │
│  │  Delay before showing: [2] seconds              │   │
│  │  Show once per session: [✓]                     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│                               [ 💾 Save Changes ]       │
└─────────────────────────────────────────────────────────┘
```

---

## Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `src/components/OfferPopup.tsx` | Frontend popup component |
| `src/components/admin/AdminOfferPopup.tsx` | Admin management interface |

### Modified Files
| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Add OfferPopup component |
| `src/components/admin/AdminSidebar.tsx` | Add navigation entry |
| `src/components/admin/AdminMobileNav.tsx` | Add mobile navigation entry |
| `src/pages/admin/AdminDashboard.tsx` | Register component and routing |

---

## Session Tracking Logic

```text
1. User visits site
2. OfferPopup component mounts
3. Check localStorage for "offer_popup_shown" key
4. If NOT shown (or show_once_per_session is false):
   a. Wait for display_delay_seconds
   b. Show popup with animation
   c. Set localStorage key (if show_once_per_session is true)
5. User can dismiss via:
   - Close button (X)
   - Click outside modal
   - CTA button click (auto-close after navigation)
```

---

## Default Values

```text
{
  is_enabled: false,
  title: "Exclusive Hajj Offer!",
  subtitle: "Limited Time Only",
  description: "Book your sacred journey now and enjoy special discounts on all our premium packages.",
  image_url: "",
  button_text: "Explore Packages",
  button_link: "#hajj",
  badge_text: "🔥 Special Offer",
  discount_text: "Save up to 20%",
  display_delay_seconds: 2,
  show_once_per_session: true,
  background_color: "#1a5f4a",
  text_color: "#ffffff",
  overlay_opacity: 80
}
```

---

## Implementation Order

1. **Create Admin Component** (`AdminOfferPopup.tsx`)
   - Full CRUD interface for popup settings
   - Uses existing patterns from AdminSettings

2. **Integrate Admin Panel**
   - Add to sidebar navigation
   - Register in AdminDashboard

3. **Create Frontend Popup** (`OfferPopup.tsx`)
   - Fetch settings and display logic
   - Session tracking with localStorage

4. **Add to Index Page**
   - Lazy load with Suspense
   - Non-blocking initialization

5. **Testing**
   - Verify enable/disable toggle works
   - Test session tracking (shows once)
   - Verify mobile responsiveness
   - Confirm CTA navigation works
