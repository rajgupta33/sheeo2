(function () {
  const U = window.SheeoUtils;
  window.SheeoPages.profile = async ({ root, session }) => {
    const profile = session.profile || {};
    root.innerHTML = `
      <form id="profile-form" class="portal-grid portal-grid-3">
        <aside class="portal-card">
          <div class="member-photo" style="width:112px;height:112px;margin-bottom:18px">${profile.profile_photo_url || profile.profile_photo_path ? `<img src="${U.escapeHtml(profile.profile_photo_url || profile.profile_photo_path)}" alt="">` : U.initials(profile.full_name)}</div>
          <h2 style="font-family:'Playfair Display',serif;margin:0">${U.escapeHtml(profile.full_name)}</h2>
          <p style="color:var(--portal-muted);font-size:11px;margin:5px 0 18px">${U.escapeHtml(profile.business_name || '')}</p>
          <div class="portal-field"><label for="profile-photo">Profile photo</label><input class="portal-input" id="profile-photo" type="file" accept="image/jpeg,image/png,image/webp"><small>Image upload will use the profile-photo Storage bucket once Supabase is connected.</small></div>
          <label style="display:flex;align-items:flex-start;gap:10px;margin-top:20px;font-size:11px"><input name="directory_visible" type="checkbox" ${profile.directory_visible ? 'checked' : ''}> <span><strong>Show me in the member directory</strong><br><span style="color:var(--portal-muted)">Only approved business fields are shared.</span></span></label>
        </aside>
        <section class="portal-card portal-span-2">
          <div class="card-head"><div><h2>Business profile</h2><p>Your login email is managed separately and may require verification to change.</p></div></div>
          <div class="portal-form-grid">
            <div class="portal-field"><label for="full-name">Full name</label><input class="portal-input" id="full-name" name="full_name" value="${U.escapeHtml(profile.full_name || '')}" required></div>
            <div class="portal-field"><label for="business-name">Business name</label><input class="portal-input" id="business-name" name="business_name" value="${U.escapeHtml(profile.business_name || '')}" required></div>
            <div class="portal-field"><label for="profile-title">Title</label><input class="portal-input" id="profile-title" name="title" value="${U.escapeHtml(profile.title || '')}"></div>
            <div class="portal-field"><label for="city">City</label><input class="portal-input" id="city" name="city" value="${U.escapeHtml(profile.city || '')}"></div>
            <div class="portal-field"><label for="category">Category</label><input class="portal-input" id="category" name="category" value="${U.escapeHtml(profile.category || '')}" placeholder="e.g. Consulting"></div>
            <div class="portal-field"><label for="services">Services</label><input class="portal-input" id="services" name="services" value="${U.escapeHtml((profile.services || []).join(', '))}" placeholder="Service one, Service two"><small>Separate services with commas.</small></div>
            <div class="portal-field portal-span-full"><label for="bio">Founder bio</label><textarea class="portal-textarea" id="bio" name="bio" maxlength="1000">${U.escapeHtml(profile.bio || '')}</textarea></div>
            <div class="portal-field"><label for="website">Website</label><input class="portal-input" id="website" name="website" type="url" value="${U.escapeHtml(profile.website || '')}"></div>
            <div class="portal-field"><label for="instagram">Instagram URL</label><input class="portal-input" id="instagram" name="instagram" type="url" value="${U.escapeHtml(profile.instagram || '')}"></div>
            <div class="portal-field"><label for="phone">Phone</label><input class="portal-input" id="phone" name="phone" type="tel" value="${U.escapeHtml(profile.phone || '')}"><small>Kept private unless explicitly approved for a future directory view.</small></div>
            <div class="portal-field"><label>Account email</label><input class="portal-input" value="${U.escapeHtml(session.user.email || '')}" disabled><small>Authentication identity</small></div>
          </div>
          <div class="button-row" style="justify-content:flex-end"><button class="portal-button" type="submit">Save profile</button></div>
        </section>
      </form>`;

    root.querySelector('#profile-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const button = form.querySelector('button[type="submit"]');
      U.setBusy(button, true, 'Saving…');
      try {
        const data = new FormData(form);
        const photoFile = form.querySelector('#profile-photo').files[0];
        if (photoFile && photoFile.size > 5 * 1024 * 1024) throw new Error('Profile photo must be 5 MB or smaller.');
        const profilePhotoPath = photoFile ? await window.SheeoApi.uploadProfilePhoto(photoFile) : profile.profile_photo_path;
        await window.SheeoApi.updateProfile({
          full_name: data.get('full_name').trim(),
          business_name: data.get('business_name').trim(),
          title: data.get('title').trim(),
          category: data.get('category').trim(),
          services: data.get('services').split(',').map((item) => item.trim()).filter(Boolean).slice(0, 12),
          city: data.get('city').trim(),
          bio: data.get('bio').trim(),
          website: data.get('website').trim(),
          instagram: data.get('instagram').trim(),
          phone: data.get('phone').trim(),
          profile_photo_path: profilePhotoPath,
          directory_visible: data.get('directory_visible') === 'on'
        });
        U.toast('Profile changes saved.');
      } catch (error) {
        U.toast(error.message || 'Profile update failed.', 'error');
      } finally { U.setBusy(button, false); }
    });
    U.renderIcons();
  };
})();
