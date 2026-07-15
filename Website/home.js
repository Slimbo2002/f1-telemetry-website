let currentIndex = 0;

function incrementCarosel(direction) {
    console.log('called, direction:', direction);
    const track = document.getElementById('carosel-track');
    const cards = track.children;
    const maxIndex = cards.length - 5; // stop when last 5 are showing

    currentIndex = Math.min(Math.max(currentIndex + direction, 0), maxIndex);

    const cardWidth = cards[0].getBoundingClientRect().width;
    const gap = 50;
    const offset = currentIndex * (cardWidth + gap);

    track.style.transform = `translateX(-${offset}px)`;
}

function setTrackWidth() {
    const track = document.getElementById('carosel-track');
    const wrapper = track.parentElement;
    const cardCount = track.children.length;
    const visibleCount = 5;
    const gap = 50;

    const wrapperWidth = wrapper.getBoundingClientRect().width;
    const cardWidth = (wrapperWidth - (visibleCount - 1) * gap) / visibleCount;
    const totalWidth = cardCount * cardWidth + (cardCount - 1) * gap;

    track.style.width = `${totalWidth}px`;
}

window.addEventListener('load', setTrackWidth);