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

onAuthStateChanged(auth, (user) => {
    const adminControls = document.getElementById('admin-controls');
    if (user) {
        isAdmin = (user.email === ADMIN_EMAIL);
        document.getElementById('user-info').innerText = user.email;
        document.getElementById('login-btn').innerText = "Logout";
        document.getElementById('login-btn').onclick = () => signOut(auth).then(() => location.reload());
        if (isAdmin) adminControls.style.display = 'block';
    }
    if (!lastVisiblePost) loadPosts();
});

window.togglePost = (e, el) => {
    if (e.target.closest('.admin-menu-container') || e.target.closest('.close-btn')) return;
    if (!el.classList.contains('active')) {
        el.classList.add('active');
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

window.closePost = (e, el) => {
    e.stopPropagation();
    el.classList.remove('active');
    setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
};

window.toggleAdminPanel = () => {
    const p = document.getElementById('admin-panel');
    p.style.display = p.style.display === 'block' ? 'none' : 'block';
};

async function loadPosts(isLoadMore = false) {
    const feed = document.getElementById('blog-feed');
    const loadMoreBtn = document.getElementById('load-more');

    // Lógica para recolher as notícias
    if (isLoadMore && loadMoreBtn.innerText === "Show Less") {
        lastVisiblePost = null;
        loadMoreBtn.innerText = "See More News";
        loadPosts(); 
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    let q;
    if (isLoadMore && lastVisiblePost) {
        q = query(collection(db, "posts"), orderBy("date", "desc"), startAfter(lastVisiblePost), limit(POSTS_PER_PAGE));
    } else {
        q = query(collection(db, "posts"), orderBy("date", "desc"), limit(POSTS_PER_PAGE));
        feed.innerHTML = "";
    }

    const snap = await getDocs(q);
    if (snap.empty) {
        loadMoreBtn.style.display = 'none';
        return;
    }

    lastVisiblePost = snap.docs[snap.docs.length - 1];

    snap.forEach(docSnap => {
        const p = docSnap.data();
        const id = docSnap.id;
        feed.innerHTML += `
            <article class="blog-card" onclick="togglePost(event, this)">
                <div class="close-btn" onclick="closePost(event, this.parentElement)">✕</div>
                <div class="card-header">
                    <div class="admin-menu-container" style="${isAdmin ? 'display:block' : 'display:none'}">
                        <span class="admin-dots" onclick="toggleOptionsMenu(event)">⋮</span>
                        <div class="admin-options">
                            <button onclick="editPost(event, '${id}')">Edit</button>
                            <button onclick="deletePost(event, '${id}')" style="color:red">Delete</button>
                        </div>
                    </div>
                    <h3>${p.title}</h3>
                </div>
                <div class="card-content">${p.content}</div>
                ${p.image ? `<div class="card-image"><img src="${p.image}"></div>` : ''}
            </article>`;
    });

    loadMoreBtn.style.display = snap.docs.length < POSTS_PER_PAGE && !isLoadMore ? 'none' : 'block';
    if (isLoadMore) loadMoreBtn.innerText = "Show Less";
}

window.loadPosts = loadPosts;
// Adicione aqui suas funções savePost, editPost e deletePost conforme o código anterior.
