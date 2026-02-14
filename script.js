import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, updateDoc, query, orderBy, limit, getDocs, startAfter, deleteDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyALHh2CFuSSWI2MR6RyiqRZZf4ABnp9Zyo",
  authDomain: "deep-horizons-51171.firebaseapp.com",
  projectId: "deep-horizons-51171",
  storageBucket: "deep-horizons-51171.firebasestorage.app",
  messagingSenderId: "670734932259",
  appId: "1:670734932259:web:07dab3af4aefb077221496",
  measurementId: "G-TPLB1K4SEY"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const ADMIN_EMAIL = "campameurer@gmail.com";

let lastVisiblePost = null;
let isAdmin = false;
const POSTS_PER_PAGE = 6;

// --- LOGIN ---
const handleLogin = async () => {
    try {
        provider.setCustomParameters({ prompt: 'select_account' });
        await signInWithPopup(auth, provider);
    } catch (e) { console.error(e); }
};

const handleLogout = () => signOut(auth).then(() => location.reload());

onAuthStateChanged(auth, (user) => {
    const adminControls = document.getElementById('admin-controls');
    const loginBtn = document.getElementById('login-btn');
    const userInfo = document.getElementById('user-info');

    if (user) {
        userInfo.innerText = user.email;
        isAdmin = (user.email === ADMIN_EMAIL);
        adminControls.style.display = isAdmin ? 'block' : 'none';
        loginBtn.innerText = "Logout";
        loginBtn.onclick = handleLogout;
    } else {
        isAdmin = false;
        userInfo.innerText = "";
        adminControls.style.display = 'none';
        loginBtn.innerText = "Login with Google";
        loginBtn.onclick = handleLogin;
    }
    if (!lastVisiblePost) loadPosts();
});

// --- UI ---
window.togglePost = (e, el) => {
    if (e.target.closest('.admin-menu-container') || e.target.closest('.close-btn') || e.target.tagName === 'IMG') return;
    if (!el.classList.contains('active')) {
        el.classList.add('active');
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

window.closePost = (e, el) => {
    e.stopPropagation();
    el.classList.remove('active');
    setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
};

window.toggleAdminPanel = () => {
    const p = document.getElementById('admin-panel');
    p.style.display = p.style.display === 'block' ? 'none' : 'block';
};

window.toggleOptionsMenu = (e) => {
    e.stopPropagation();
    const menu = e.currentTarget.nextElementSibling;
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
};

// --- LIGHTBOX (IMAGEM CHEIA) ---
window.openFullscreen = (e, imgSrc) => {
    e.stopPropagation();
    const card = e.target.closest('.blog-card');
    if (card.classList.contains('active')) {
        const overlay = document.getElementById('image-overlay');
        document.getElementById('fullscreen-img').src = imgSrc;
        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    } else {
        // Se clicar na imagem fora da notícia aberta, apenas abre a notícia
        togglePost(e, card);
    }
};

window.closeFullscreen = () => {
    document.getElementById('image-overlay').style.display = 'none';
    document.body.style.overflow = 'auto';
};

// --- DATA ---
async function loadPosts(isLoadMore = false) {
    const feed = document.getElementById('blog-feed');
    const loadMoreBtn = document.getElementById('load-more');

    if (isLoadMore && loadMoreBtn.innerText === "Show Less") {
        lastVisiblePost = null;
        loadMoreBtn.innerText = "See More News";
        loadPosts();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    let q = isLoadMore && lastVisiblePost 
        ? query(collection(db, "posts"), orderBy("date", "desc"), startAfter(lastVisiblePost), limit(POSTS_PER_PAGE))
        : query(collection(db, "posts"), orderBy("date", "desc"), limit(POSTS_PER_PAGE));

    if (!isLoadMore) feed.innerHTML = "";
    const snap = await getDocs(q);
    
    if (snap.empty) { loadMoreBtn.style.display = 'none'; return; }
    lastVisiblePost = snap.docs[snap.docs.length - 1];

    snap.forEach(docSnap => {
        const p = docSnap.data();
        const id = docSnap.id;
        feed.innerHTML += `
            <article class="blog-card" onclick="togglePost(event, this)">
                <div class="close-btn" onclick="closePost(event, this.parentElement)">✕</div>
                <div class="card-header">
                    ${isAdmin ? `<div class="admin-menu-container">
                        <span class="admin-dots" onclick="toggleOptionsMenu(event)">⋮</span>
                        <div class="admin-options">
                            <button onclick="editPost(event, '${id}')">Edit</button>
                            <button onclick="deletePost(event, '${id}')" style="color:red">Delete</button>
                        </div>
                    </div>` : ''}
                    <h3>${p.title}</h3>
                </div>
                <div class="card-content">${p.content}</div>
                ${p.image ? `<div class="card-image"><img src="${p.image}" onclick="openFullscreen(event, '${p.image}')"></div>` : ''}
            </article>`;
    });

    loadMoreBtn.style.display = 'block';
    loadMoreBtn.innerText = isLoadMore ? "Show Less" : "See More News";
}

window.loadPosts = loadPosts;

// --- ADMIN OPS ---
window.savePost = async () => {
    if (!isAdmin) return;
    const id = document.getElementById('edit-id').value;
    const data = {
        title: document.getElementById('post-title').value,
        image: document.getElementById('post-image').value,
        content: document.getElementById('post-body').value,
        date: new Date()
    };
    id ? await updateDoc(doc(db, "posts", id), data) : await addDoc(collection(db, "posts"), data);
    location.reload();
};

window.deletePost = async (e, id) => {
    e.stopPropagation();
    if (isAdmin && confirm("Delete?")) { await deleteDoc(doc(db, "posts", id)); location.reload(); }
};

window.editPost = async (e, id) => {
    e.stopPropagation();
    const snap = await getDoc(doc(db, "posts", id));
    if (snap.exists() && isAdmin) {
        const p = snap.data();
        document.getElementById('admin-panel').style.display = 'block';
        document.getElementById('edit-id').value = id;
        document.getElementById('post-title').value = p.title;
        document.getElementById('post-image').value = p.image;
        document.getElementById('post-body').value = p.content;
        window.scrollTo(0,0);
    }
};
