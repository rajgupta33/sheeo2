(function () {
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const state = clone(window.SHEEO_MOCK_DATA || {});
  const configuredClient = () => window.SheeoSupabase?.init?.();
  const isMock = () => !window.SheeoSupabase?.configured || window.SHEEO_CONFIG?.MOCK_MODE === true;
  const wait = (value, delay = 90) => new Promise((resolve) => window.setTimeout(() => resolve(clone(value)), delay));

  const signedProfilePhoto = async (path) => {
    if (!path || path.startsWith('/') || /^https?:\/\//i.test(path)) return path;
    const { data, error } = await requireClient().storage.from('profile-photos').createSignedUrl(path, 3600);
    if (error) return null;
    return data?.signedUrl || null;
  };

  const requireClient = () => {
    const client = configuredClient();
    if (!client) throw new Error('Supabase is not configured. Add the project URL and publishable key in assets/js/config.js.');
    return client;
  };

  window.SheeoApi = {
    isMock,

    async getSession() {
      if (isMock()) return wait(state.session);
      const client = requireClient();
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      if (!data.session) return null;
      const [profileResult, membershipResult, adminRoleResult] = await Promise.all([
        client.from('profiles').select('id,full_name,business_name,title,category,services,bio,city,website,instagram,phone,profile_photo_path,directory_visible,referral_code').eq('id', data.session.user.id).single(),
        client.from('memberships').select('id,status,start_date,end_date,payment_status,membership_plans(name)').eq('user_id', data.session.user.id).order('start_date', { ascending: false }).limit(1).maybeSingle(),
        client.from('admin_roles').select('role').eq('user_id', data.session.user.id).eq('active', true).maybeSingle()
      ]);
      if (profileResult.error) throw profileResult.error;
      if (membershipResult.error) throw membershipResult.error;
      if (adminRoleResult.error) throw adminRoleResult.error;
      const profile = profileResult.data;
      if (profile?.profile_photo_path) profile.profile_photo_url = await signedProfilePhoto(profile.profile_photo_path);
      const membership = membershipResult.data ? {
        ...membershipResult.data,
        plan_name: membershipResult.data.membership_plans?.name || 'SheEO Membership'
      } : null;
      return { user: data.session.user, profile, membership, admin_role: adminRoleResult.data?.role || null };
    },

    async signIn(email, password) {
      if (isMock()) {
        if (!email || !password) throw new Error('Enter both email and password.');
        return wait(state.session, 300);
      }
      const client = requireClient();
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    },

    async signOut() {
      if (isMock()) return wait(true);
      const { error } = await requireClient().auth.signOut();
      if (error) throw error;
      return true;
    },

    async requestPasswordReset(email) {
      if (isMock()) return wait({ email }, 300);
      const redirectTo = `${window.location.origin}/portal/reset-password.html`;
      const { error } = await requireClient().auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      return { email };
    },

    async updatePassword(password) {
      if (isMock()) return wait(true, 300);
      const { error } = await requireClient().auth.updateUser({ password });
      if (error) throw error;
      return true;
    },

    async getDashboard() {
      if (isMock()) {
        const balance = state.pointTransactions.reduce((sum, transaction) => sum + transaction.points, 0);
        return wait({
          session: state.session,
          balance,
          recentActivity: state.pointTransactions.slice(0, 5),
          pendingClaims: state.claims.filter((claim) => claim.user_id === state.session.user.id && claim.status === 'pending').length,
          referralsRewarded: state.referrals.filter((referral) => referral.status === 'rewarded').length
        });
      }
      const client = requireClient();
      const [{ data: balanceRow, error: balanceError }, { data: activity, error: activityError }] = await Promise.all([
        client.from('member_point_balances').select('balance').maybeSingle(),
        client.from('point_transactions').select('id,created_at,description,transaction_type,points').order('created_at', { ascending: false }).limit(5)
      ]);
      if (balanceError) throw balanceError;
      if (activityError) throw activityError;
      return { session: await this.getSession(), balance: Number(balanceRow?.balance || 0), recentActivity: activity || [], pendingClaims: 0, referralsRewarded: 0 };
    },

    async getPointTransactions() {
      if (isMock()) return wait(state.pointTransactions);
      const { data, error } = await requireClient().from('point_transactions').select('id,created_at,description,transaction_type,points,source_id').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },

    async getClaims({ all = false } = {}) {
      if (isMock()) return wait(all ? state.claims : state.claims.filter((claim) => claim.user_id === state.session.user.id));
      let query = requireClient().from('point_claims').select('id,user_id,claim_type,activity_date,related_member_id,description,evidence_path,status,rejection_reason,created_at').order('created_at', { ascending: false });
      if (!all) query = query.eq('user_id', (await this.getSession()).user.id);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    async submitClaim(payload) {
      if (isMock()) {
        const claim = {
          id: `claim-mock-${Date.now()}`,
          user_id: state.session.user.id,
          member_name: state.session.profile.full_name,
          status: 'pending',
          created_at: new Date().toISOString(),
          ...payload
        };
        state.claims.unshift(claim);
        return wait(claim, 320);
      }
      const session = await this.getSession();
      const insertPayload = {
        ...payload,
        user_id: session.user.id,
        membership_id: session.membership?.id,
        status: 'pending'
      };
      if (!insertPayload.membership_id) throw new Error('An active membership is required to submit a claim.');
      const { data, error } = await requireClient().from('point_claims').insert(insertPayload).select().single();
      if (error) throw error;
      return data;
    },

    async uploadClaimEvidence(file) {
      if (isMock()) return `pending/${file.name}`;
      const session = await this.getSession();
      const extension = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
      const objectId = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const path = `${session.user.id}/${objectId}.${extension}`;
      const { error } = await requireClient().storage.from('claim-evidence').upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      return path;
    },

    async getMembers() {
      if (isMock()) return wait(state.members.filter((member) => member.status === 'active' && member.directory_visible));
      const { data, error } = await requireClient().from('member_directory').select('id,full_name,business_name,title,city,category,services,profile_photo_path,website');
      if (error) throw error;
      return Promise.all((data || []).map(async (member) => ({
        ...member,
        profile_photo_path: await signedProfilePhoto(member.profile_photo_path)
      })));
    },

    async updateProfile(payload) {
      if (isMock()) {
        Object.assign(state.session.profile, payload);
        return wait(state.session.profile, 280);
      }
      const { data, error } = await requireClient().from('profiles').update(payload).eq('id', (await this.getSession()).user.id).select().single();
      if (error) throw error;
      return data;
    },

    async uploadProfilePhoto(file) {
      if (isMock()) return URL.createObjectURL(file);
      const session = await this.getSession();
      const extension = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
      const path = `${session.user.id}/profile-${Date.now()}.${extension}`;
      const { error } = await requireClient().storage.from('profile-photos').upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      return path;
    },

    async getReferrals({ all = false } = {}) {
      if (isMock()) return wait(state.referrals);
      let query = requireClient().from('referrals').select('id,referral_code,referred_email,status,qualified_at,rewarded_at,created_at').order('created_at', { ascending: false });
      if (!all) query = query.eq('referrer_user_id', (await this.getSession()).user.id);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    async getRewards() {
      if (isMock()) return wait({ rewards: state.rewards, redemptions: state.redemptions });
      const [{ data: rewards, error: rewardsError }, { data: redemptions, error: redemptionsError }] = await Promise.all([
        requireClient().from('rewards').select('id,name,reward_type,points_cost,fulfillment_instructions').eq('active', true),
        requireClient().from('reward_redemptions').select('id,reward_id,points_cost,status,requested_at,fulfilled_at,rewards(name)').order('requested_at', { ascending: false })
      ]);
      if (rewardsError) throw rewardsError;
      if (redemptionsError) throw redemptionsError;
      return { rewards: rewards || [], redemptions: redemptions || [] };
    },

    async redeemReward(rewardId) {
      if (isMock()) {
        const balance = state.pointTransactions.reduce((sum, transaction) => sum + transaction.points, 0);
        if (balance < 100) throw new Error('You need at least 100 available points to redeem this reward.');
        const reward = state.rewards.find((item) => item.id === rewardId);
        const redemption = { id: `redemption-${Date.now()}`, reward_name: reward.name, points_cost: 100, status: 'requested', requested_at: new Date().toISOString() };
        state.redemptions.unshift(redemption);
        state.pointTransactions.unshift({ id: `pt-${Date.now()}`, created_at: new Date().toISOString(), description: `Reward: ${reward.name}`, transaction_type: 'redemption', points: -100, status: 'approved', source: redemption.id });
        return wait(redemption, 350);
      }
      const requestKey = window.crypto?.randomUUID?.() || `reward-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const { data: redemptionId, error } = await requireClient().rpc('redeem_reward', { p_reward_id: rewardId, p_request_key: requestKey });
      if (error) throw error;
      const reward = (await this.getRewards()).rewards.find((item) => item.id === rewardId);
      return { id: redemptionId, reward_name: reward?.name || 'SheEO Reward', points_cost: reward?.points_cost || 100, status: 'requested', requested_at: new Date().toISOString() };
    },

    async getMembership() { return isMock() ? wait(state.session.membership) : (await this.getSession()).membership; },

    async getAdminOverview() {
      if (isMock()) return wait({
        activeMembers: state.members.filter((member) => member.status === 'active').length,
        pendingApplications: state.applications.filter((item) => item.status === 'pending').length,
        pendingClaims: state.claims.filter((item) => item.status === 'pending').length,
        pendingReferrals: state.referrals.filter((item) => ['captured', 'pending', 'qualified'].includes(item.status)).length,
        pendingRedemptions: state.redemptions.filter((item) => ['requested', 'approved', 'scheduled'].includes(item.status)).length,
        upcomingEvents: state.events.filter((item) => new Date(item.event_date) >= new Date()).length,
        applications: state.applications,
        claims: state.claims,
        auditLog: state.auditLog
      });
      const { data, error } = await requireClient().rpc('admin_portal_overview');
      if (error) throw error;
      return data;
    },

    async getAdminMembers() {
      if (isMock()) return wait(state.members);
      const client = requireClient();
      const [{ data: profiles, error: profileError }, { data: memberships, error: membershipError }] = await Promise.all([
        client.from('profiles').select('id,full_name,business_name,title,category,services,city,directory_visible'),
        client.from('memberships').select('user_id,status,start_date,end_date').order('created_at', { ascending: false })
      ]);
      if (profileError) throw profileError;
      if (membershipError) throw membershipError;
      return (profiles || []).map((profile) => ({ ...profile, status: memberships?.find((membership) => membership.user_id === profile.id)?.status || 'applicant' }));
    },
    async getEvents() {
      if (isMock()) return wait(state.events);
      const { data, error } = await requireClient().from('events').select('id,title,event_date,venue,status,points_enabled,attendance_points').order('event_date');
      if (error) throw error;
      return data || [];
    },
    async getAuditLog() {
      if (isMock()) return wait(state.auditLog);
      const { data, error } = await requireClient().from('audit_log').select('id,actor_user_id,action,target_type,target_id,created_at').order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      return (data || []).map((item) => ({ ...item, actor: item.actor_user_id || 'System', target: `${item.target_type} ${item.target_id || ''}`.trim() }));
    },
    async getApplications() {
      if (isMock()) return wait(state.applications);
      const { data, error } = await requireClient().from('member_applications').select('id,email,full_name,business_name,category,status,created_at').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },

    async reviewClaim(claimId, decision, reason = '') {
      if (isMock()) {
        const claim = state.claims.find((item) => item.id === claimId);
        if (!claim) throw new Error('Claim not found.');
        claim.status = decision;
        claim.rejection_reason = decision === 'rejected' ? reason : null;
        claim.reviewed_at = new Date().toISOString();
        state.auditLog.unshift({ id: `audit-${Date.now()}`, actor: state.session.profile.full_name, action: `${decision}_point_claim`, target: claim.id, created_at: new Date().toISOString() });
        return wait(claim, 300);
      }
      const functionName = decision === 'approved' ? 'approve_point_claim' : 'reject_point_claim';
      const args = decision === 'approved' ? { p_claim_id: claimId } : { p_claim_id: claimId, p_reason: reason };
      const { data, error } = await requireClient().rpc(functionName, args);
      if (error) throw error;
      return { id: claimId, status: decision, rejection_reason: decision === 'rejected' ? reason : null, result: data };
    }
  };
})();
