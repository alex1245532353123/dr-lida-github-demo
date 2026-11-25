const tabList = document.querySelector('.clinic-tabs');
const hero = document.querySelector('.hero');
hero.id = 'home';
const homeTab = document.createElement('button');
homeTab.type = 'button';
homeTab.id = 'tab-home';
homeTab.setAttribute('role', 'tab');
homeTab.setAttribute('aria-controls', hero.id);
homeTab.textContent = 'Главная';
tabList.prepend(homeTab);
hero.before(tabList);

const tabs = Array.from(tabList.querySelectorAll('[role="tab"]'));
const panelsById = new Map(tabs.map((tab) => [tab.getAttribute('aria-controls'), tab]));

function selectTab(selectedTab) {
  for (const [panelId, tab] of panelsById) {
    const selected = tab === selectedTab;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    const panel = document.getElementById(panelId);
    panel.hidden = !selected;
    if (selected) panel.scrollTop = 0;
  }
}

for (const [panelId, tab] of panelsById) {
  const panel = document.getElementById(panelId);
  panel.setAttribute('role', 'tabpanel');
  panel.setAttribute('aria-labelledby', tab.id);
  panel.tabIndex = 0;
  tab.addEventListener('click', () => selectTab(tab));
}

tabList.addEventListener('keydown', (event) => {
  const index = tabs.indexOf(event.target);
  const nextIndex = {
    ArrowLeft: (index + tabs.length - 1) % tabs.length,
    ArrowRight: (index + 1) % tabs.length,
    Home: 0,
    End: tabs.length - 1,
  }[event.key];
  if (index < 0 || nextIndex === undefined) return;
  event.preventDefault();
  selectTab(tabs[nextIndex]);
  tabs[nextIndex].focus();
});

for (const link of document.querySelectorAll('a[href^="#"]')) {
  link.addEventListener('click', (event) => {
    if (event.defaultPrevented) return;
    const target = link.getAttribute('href');
    const tab = target.startsWith('#') && panelsById.get(target.slice(1));
    if (!tab) return;
    event.preventDefault();
    selectTab(tab);
    tab.focus({ preventScroll: true });
  });
}

function selectFromAddress() {
  const target = window.location.hash.slice(1);
  const sorochinsk = target === 'sorochinsk' && document.getElementById(target);
  selectTab(panelsById.get(sorochinsk ? 'contacts' : target) ?? homeTab);
  if (sorochinsk) {
    requestAnimationFrame(() => sorochinsk.scrollIntoView({ block: 'center', behavior: 'instant' }));
  }
}

selectFromAddress();
window.addEventListener('hashchange', selectFromAddress);
tabList.hidden = false;
document.documentElement.classList.add('clinic-screen');

const compactScreen = window.matchMedia('(max-width: 1000px), (max-height: 690px)');

for (const grid of document.querySelectorAll('.review-grid')) {
  const cards = Array.from(grid.children);
  if (cards.length < 2) continue;

  const pager = document.createElement('div');
  pager.className = 'clinic-pager';
  pager.innerHTML = '<button class="button" type="button">Назад</button><span aria-live="polite"></span><button class="button" type="button">Далее</button>';
  const [previous, status, next] = pager.children;
  grid.before(pager);
  let page = 0;

  function render() {
    pager.hidden = !compactScreen.matches;
    grid.classList.toggle('clinic-paged-grid', compactScreen.matches);
    for (const [index, card] of cards.entries()) {
      card.hidden = compactScreen.matches && index !== page;
    }
    status.textContent = `${page + 1} / ${cards.length}`;
    previous.disabled = page === 0;
    next.disabled = page === cards.length - 1;
  }

  previous.addEventListener('click', () => {
    page -= 1;
    render();
    if (previous.disabled) next.focus({ preventScroll: true });
  });
  next.addEventListener('click', () => {
    page += 1;
    render();
    if (next.disabled) previous.focus({ preventScroll: true });
  });
  compactScreen.addEventListener('change', render);
  render();
}
