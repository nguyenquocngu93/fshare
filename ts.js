Lampa.Listener.follow('full', () => {
    const button = document.createElement('button');
    button.className = 'full-start__button selector';
    button.textContent = 'Start';

    button.addEventListener('mouseenter', () => {
        // Handle hover enter
    });

    button.addEventListener('click', () => {
        Torrentio.search();
    });

    document.body.appendChild(button);
});

Lampa.Select.show('Torrentio', (result) => {
    Lampa.Player.play(result.url);
});