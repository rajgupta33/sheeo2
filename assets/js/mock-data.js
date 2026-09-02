window.SHEEO_MOCK_DATA = {
  session: {
    user: { id: 'user-sadhna', email: 'sadhna@example.com' },
    profile: {
      id: 'user-sadhna',
      full_name: 'Sadhna Sharma',
      first_name: 'Sadhna',
      business_name: 'SheEO Summit',
      title: 'Founder & Community Builder',
      category: 'Community',
      services: ['Business Networking', 'Founder Visibility'],
      bio: 'Building a thoughtful network where women founders grow through visibility, collaboration and genuine business relationships.',
      city: 'Dubai',
      website: 'https://sheeo-summit.com',
      instagram: 'https://www.instagram.com/sheeosummit2026/',
      phone: '+971 50 709 1969',
      profile_photo_path: '/founder-sadhna.jpg',
      directory_visible: true,
      referral_code: 'SADHNA842'
    },
    membership: {
      id: 'membership-2026',
      status: 'active',
      plan_name: 'SheEO Annual Membership',
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      payment_status: 'paid',
      renewal_status: 'due_in_december'
    },
    admin_role: 'super_admin'
  },
  pointTransactions: [
    { id: 'pt-5', created_at: '2026-08-20T09:30:00Z', description: '1-on-1 Member Meetup', transaction_type: 'meetup', points: 5, status: 'approved', source: 'Claim #1048' },
    { id: 'pt-4', created_at: '2026-08-12T15:10:00Z', description: 'SheEO Coffee Connect Attendance', transaction_type: 'event', points: 5, status: 'approved', source: 'Event attendance' },
    { id: 'pt-3', created_at: '2026-07-29T12:15:00Z', description: '1-on-1 Member Meetup', transaction_type: 'meetup', points: 5, status: 'approved', source: 'Claim #1022' },
    { id: 'pt-2', created_at: '2026-07-14T08:45:00Z', description: 'Founder Referral: Amina K.', transaction_type: 'referral', points: 20, status: 'approved', source: 'Referral #201' },
    { id: 'pt-1', created_at: '2026-01-01T07:00:00Z', description: 'Membership Activated', transaction_type: 'welcome', points: 50, status: 'approved', source: 'Membership 2026' }
  ],
  claims: [
    { id: 'claim-1054', user_id: 'user-sadhna', member_name: 'Sadhna Sharma', claim_type: 'collaboration', activity_date: '2026-08-23', related_member: 'Meher Rupa', description: 'Joint founder visibility workshop and content exchange.', evidence_path: 'mock/collab-proof.pdf', status: 'pending', created_at: '2026-08-23T11:00:00Z' },
    { id: 'claim-1048', user_id: 'user-sadhna', member_name: 'Sadhna Sharma', claim_type: 'meetup', activity_date: '2026-08-20', related_member: 'Nitasha Saxena', description: 'One-hour business strategy meetup.', evidence_path: 'mock/meetup-photo.jpg', status: 'approved', created_at: '2026-08-20T08:20:00Z' }
  ],
  referrals: [
    { id: 'ref-203', founder_name: 'Layla H.', referred_email: 'l***@example.com', status: 'pending', created_at: '2026-08-22T10:00:00Z', points: 0 },
    { id: 'ref-202', founder_name: 'Noor A.', referred_email: 'n***@example.com', status: 'captured', created_at: '2026-08-10T10:00:00Z', points: 0 },
    { id: 'ref-201', founder_name: 'Amina K.', referred_email: 'a***@example.com', status: 'rewarded', created_at: '2026-07-02T10:00:00Z', qualified_at: '2026-07-14T08:45:00Z', points: 20 }
  ],
  rewards: [
    { id: 'reward-event', name: '50% Event Access', reward_type: 'event_discount', points_cost: 100, description: 'Receive 50% off one eligible SheEO event. Eligibility is confirmed by the team before fulfillment.', active: true, icon: 'ticket-percent' },
    { id: 'reward-reel', name: 'Instagram Reel Feature', reward_type: 'instagram_reel', points_cost: 100, description: 'A dedicated Reel feature introducing your founder story and business to the SheEO audience.', active: true, icon: 'clapperboard' }
  ],
  redemptions: [
    { id: 'redemption-48', member_name: 'Sadhna Sharma', reward_name: '50% Event Access', points_cost: 100, status: 'fulfilled', requested_at: '2025-10-02T10:00:00Z', fulfilled_at: '2025-10-06T10:00:00Z' }
  ],
  members: [
    { id: 'user-sadhna', full_name: 'Sadhna Sharma', business_name: 'SheEO Summit', title: 'Founder & Community Builder', city: 'Dubai', category: 'Community', services: ['Business Networking', 'Founder Visibility'], profile_photo_path: '/founder-sadhna.jpg', website: 'https://sheeo-summit.com', directory_visible: true, status: 'active' },
    { id: 'user-nitasha', full_name: 'Nitasha Saxena', business_name: 'Mindful Makeup', title: 'Makeup Educator', city: 'Dubai', category: 'Beauty', services: ['Workshops', 'Makeup Education'], profile_photo_path: '/sheeo-member/nitasha.jpeg', website: 'http://www.mindfulmakeup.me', directory_visible: true, status: 'active' },
    { id: 'user-mehak', full_name: 'Mehak Marwaha', business_name: 'Ekaa Radiance', title: 'Wellness Founder', city: 'Dubai', category: 'Wellness', services: ['Holistic Wellness', 'Founder Coaching'], profile_photo_path: '/sheeo-member/mehak.jpeg', website: 'http://www.ekaa.me', directory_visible: true, status: 'active' },
    { id: 'user-raina', full_name: 'Raina Desai', business_name: 'Creative Studio', title: 'Creative Entrepreneur', city: 'Dubai', category: 'Design', services: ['Creative Direction', 'Design'], profile_photo_path: '/sheeo-member/RAINA DESAI.jpeg', website: '#', directory_visible: true, status: 'active' },
    { id: 'user-meher', full_name: 'Meher Rupa', business_name: 'Mohaul', title: 'Fashion Founder', city: 'Dubai', category: 'Fashion', services: ['Apparel', 'Styling'], profile_photo_path: '/sheeo-member/meher rupaa.jpeg', website: '#', directory_visible: true, status: 'active' }
  ],
  applications: [
    { id: 'app-301', full_name: 'Maya Kapoor', email: 'maya@example.com', business_name: 'Maya Strategy', category: 'Consulting', status: 'pending', created_at: '2026-08-24T08:00:00Z' },
    { id: 'app-302', full_name: 'Farah Malik', email: 'farah@example.com', business_name: 'Noor Wellness', category: 'Wellness', status: 'pending', created_at: '2026-08-23T13:30:00Z' }
  ],
  events: [
    { id: 'event-401', title: 'SheEO Founder Breakfast', event_date: '2026-09-18', venue: 'Dubai', status: 'published', points_enabled: true, attendance_points: 5 },
    { id: 'event-402', title: 'Coffee Connect', event_date: '2026-10-06', venue: 'Dubai', status: 'draft', points_enabled: true, attendance_points: 5 }
  ],
  auditLog: [
    { id: 'audit-1', actor: 'Sadhna Sharma', action: 'approve_point_claim', target: 'Claim #1048', created_at: '2026-08-20T09:30:00Z' },
    { id: 'audit-2', actor: 'System', action: 'qualify_referral', target: 'Referral #201', created_at: '2026-07-14T08:45:00Z' },
    { id: 'audit-3', actor: 'Sadhna Sharma', action: 'activate_membership', target: 'Amina K.', created_at: '2026-07-14T08:40:00Z' }
  ]
};
