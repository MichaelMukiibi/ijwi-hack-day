export function printReport(target: 'handoff' | 'doctor') {
  const previousTarget = document.body.dataset.printTarget;
  document.body.dataset.printTarget = target;

  const restoreTarget = () => {
    if (previousTarget === undefined) delete document.body.dataset.printTarget;
    else document.body.dataset.printTarget = previousTarget;
    window.removeEventListener('afterprint', restoreTarget);
  };

  window.addEventListener('afterprint', restoreTarget, { once: true });
  window.print();
}
