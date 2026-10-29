(function (root) {
  'use strict';

  const defaultAvatar = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" fill="#dce8df"/><circle cx="40" cy="29" r="13" fill="#8da798"/><path d="M14 74a26 26 0 0 1 52 0" fill="#8da798"/></svg>');

  function apply(contact) {
    const name = contact.name.trim() || 'Contato';
    document.querySelector('#chat-name').textContent = name;
    document.querySelector('#chat-name').title = name;
    document.querySelector('#badge').hidden = !contact.verified;
    let avatar = contact.avatar || defaultAvatar;
    // Old links may still reference the bundled example image by its original path.
    if (avatar === 'assets/' + 'prevent-senior.png') avatar = root.FakeFlowsDefault().contact.avatar;
    for (const selector of ['#chat-avatar', '#editor-avatar']) {
      const image = document.querySelector(selector);
      image.onerror = () => {
        image.onerror = null;
        image.src = defaultAvatar;
      };
      image.src = avatar;
    }
  }

  root.FakeFlowsProfile = { apply };
})(globalThis);
