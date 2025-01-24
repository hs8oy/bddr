// تهيئة Firebase
const firebaseConfig = {
    // قم بنسخ بيانات التهيئة من لوحة تحكم Firebase الخاصة بك
    apiKey: "your-api-key",
    authDomain: "your-auth-domain",
    databaseURL: "your-database-url",
    projectId: "your-project-id",
    storageBucket: "your-storage-bucket",
    messagingSenderId: "your-messaging-sender-id",
    appId: "your-app-id"
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const visitsRef = database.ref('visits');

// تحديث عداد الزيارات
function updateVisitorCount() {
    visitsRef.transaction((currentVisits) => {
        return (currentVisits || 0) + 1;
    });
}

// عرض عدد الزيارات في الوقت الفعلي
visitsRef.on('value', (snapshot) => {
    const visits = snapshot.val() || 0;
    document.getElementById('visitCounter').textContent = new Intl.NumberFormat('ar-EG').format(visits);
});

// تحديث العداد عند تحميل الصفحة
window.addEventListener('load', updateVisitorCount);
