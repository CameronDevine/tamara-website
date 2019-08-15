function resize() {
  document.getElementById('content').style.minHeight = 'calc(100% - ' + (document.getElementsByTagName('footer')[0].clientHeight) + 'px)';
}
window.onload = resize;
window.onresize = resize;
