(() => {
    const announcement = document.getElementById('home-event');
    if (!announcement) return;

    const eventTime = new Date('2026-09-23T11:00:00+04:00').getTime();
    let previousFocus = null;

    function dismiss() {
        const focusInside = announcement.contains(document.activeElement);
        announcement.hidden = true;
        if (focusInside && previousFocus && previousFocus.isConnected) previousFocus.focus();
    }

    announcement.querySelector('button').addEventListener('click', dismiss);
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !announcement.hidden) dismiss();
    });

    function scheduleAnnouncement() {
        window.setTimeout(() => {
            if (Date.now() >= eventTime) return;
            previousFocus = document.activeElement;
            announcement.hidden = false;
        }, 4000);
    }

    if (document.readyState === 'complete') scheduleAnnouncement();
    else window.addEventListener('load', scheduleAnnouncement, { once: true });
})();
