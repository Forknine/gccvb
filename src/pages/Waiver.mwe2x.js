// Waiver Page Code (saves emergency contact fields)
import wixData from 'wix-data';
import wixLocation from 'wix-location';
import { currentMember, authentication } from 'wix-members';

const SEASON = '2025-26';
const COLLECTION = 'Waiver'; // your collection ID

$w.onReady(async () => {
  console.log('[WAIVER] Page ready');

  // Wire a quick click log to confirm handler attaches
  $w('#submitBtn').onClick(() => console.log('[WAIVER] Submit clicked'));

  // Require login
  let member = await currentMember.getMember({ fieldsets: ['FULL'] });
  if (!member) {
    await authentication.promptLogin();
    wixLocation.to(wixLocation.url);
    return;
  }

  // Prefill name + email
  const profile = member.profile || {};
  const name =
    (profile.firstName || profile.lastName)
      ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
      : (profile.nickname || '');
  const email = member.loginEmail || (profile.emails && profile.emails[0]?.email) || '';

  $w('#nameInput').value = name || '';
  $w('#emailInput').value = email || '';
  $w('#nameInput').readOnly = !!name;
  $w('#emailInput').readOnly = !!email;

  // One-per-season check
  const memberId = member._id || member.id;
  try {
    const existing = await wixData.query(COLLECTION)
      .eq('memberId', memberId)
      .eq('season', SEASON)
      .limit(1)
      .find();

    if (existing.items.length) {
      $w('#formBox').collapse();
      $w('#alreadySignedBox').expand();
    } else {
      $w('#alreadySignedBox').collapse();
      $w('#formBox').expand();
    }
  } catch (e) {
    console.error('[WAIVER] status check error', e);
  }

  // Submit
  $w('#submitBtn').onClick(async () => {
    console.log('[WAIVER] Submit handler running');
    try {
      // Validation
      const nm = ($w('#nameInput').value || '').trim();
      const em = ($w('#emailInput').value || '').trim();
      if (!nm || !em) return console.warn('[WAIVER] missing name/email');

      // (Optional) require emergency contact fields
      const emgName = ($w('#emgName').value || '').trim();
      const emgPhone = ($w('#emgPhone').value || '').trim();
      // if (!emgName || !emgPhone) return console.warn('[WAIVER] missing emergency contact');

      const initialsIds = ['#initRisks','#initAssumption','#initRelease','#initIndemnity','#initHealth','#initMedical'];
      for (const id of initialsIds) {
        const v = ($w(id).value || '').trim();
        if (!/^[A-Za-z.]{1,5}$/.test(v)) {
          console.warn('[WAIVER] invalid initials at', id);
          return;
        }
      }
      if (!$w('#ack').checked) return console.warn('[WAIVER] ack not checked');

      // Disable while saving
      const btn = $w('#submitBtn');
      const oldLabel = btn.label; btn.disable(); btn.label = 'Saving…';

      // Race-safe duplicate check
      const dup = await wixData.query(COLLECTION)
        .eq('memberId', memberId)
        .eq('season', SEASON)
        .limit(1)
        .find();
      if (dup.items.length) {
        $w('#formBox').collapse();
        $w('#alreadySignedBox').expand();
        btn.label = oldLabel; btn.enable();
        return;
      }

      // Optional signature (ignore if not present)
      let signatureDataUrl;
      try { signatureDataUrl = $w('#signature').value || undefined; } catch(_) {}

      // Build document — now includes emergency fields
      const doc = {
        season: SEASON,
        memberId,
        name: nm,
        email: em,
        emergencyName: emgName,
        emergencyPhone: emgPhone,
        initRisks: $w('#initRisks').value.trim(),
        initAssumption: $w('#initAssumption').value.trim(),
        initRelease: $w('#initRelease').value.trim(),
        initIndemnity: $w('#initIndemnity').value.trim(),
        initHealth: $w('#initHealth').value.trim(),
        initMedical: $w('#initMedical').value.trim(),
        consentRoster: !!$w('#consentRoster').checked,
        consentMedia: !!$w('#consentMedia').checked,
        acknowledged: !!$w('#ack').checked,
        signedAt: new Date()
      };
      if (signatureDataUrl) doc.signatureDataUrl = signatureDataUrl;

      const res = await wixData.insert(COLLECTION, doc);
      console.log('[WAIVER] saved _id:', res?._id);

      $w('#formBox').collapse();
      $w('#alreadySignedBox').expand();

      btn.label = oldLabel; btn.enable();
    } catch (err) {
      console.error('[WAIVER] Save error', err);
      try { $w('#submitBtn').enable(); } catch(_) {}
    }
  });
});
