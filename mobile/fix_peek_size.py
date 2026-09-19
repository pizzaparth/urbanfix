import re

with open('src/components/PeekWrapper.jsx', 'r') as f:
    content = f.read()

content = content.replace("""  overlayContainer: {
    position: 'absolute',
    top: -height,
    bottom: -height,
    left: -width,
    right: -width,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 9999,
  },""", """  overlayContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 0,
    height: 0,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 9999,
    zIndex: 9999,
  },""")

content = content.replace("""  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },""", """  backdrop: {
    position: 'absolute',
    width: width * 3,
    height: height * 3,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },""")

with open('src/components/PeekWrapper.jsx', 'w') as f:
    f.write(content)
