document.addEventListener('DOMContentLoaded', async () => {
    const blogGrid = document.getElementById('blog-grid');
    const filterButtons = document.querySelectorAll('.filter-btn');
    let allPosts = [];

    try {
        const response = await fetch('data/posts.json');
        if (!response.ok) throw new Error('데이터를 불러올 수 없습니다.');
        const data = await response.json();
        // 최신 날짜순(내림차순)으로 정렬
        allPosts = data.posts.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        renderPosts(allPosts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        blogGrid.innerHTML = '<p class="error-msg">블로그 내용을 불러오는 데 실패했습니다.</p>';
    }

    // 카테고리 필터링 클릭 핸들러
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // 활성 버튼 스타일 변경
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const category = btn.getAttribute('data-category');
            if (category === 'all') {
                renderPosts(allPosts);
            } else {
                const filtered = allPosts.filter(post => post.category === category);
                renderPosts(filtered);
            }
        });
    });

    function renderPosts(posts) {
        if (posts.length === 0) {
            blogGrid.innerHTML = '<p class="empty-msg">해당 카테고리에 등록된 포스트가 없습니다.</p>';
            return;
        }

        blogGrid.innerHTML = posts.map(post => `
            <a href="post.html?id=${post.id}" class="blog-card">
                <div class="blog-card-meta">
                    <span class="blog-card-category">${post.category}</span>
                    <span class="blog-card-date">${post.date}</span>
                </div>
                <h3 class="blog-card-title">${post.title}</h3>
                <p class="blog-card-summary">${post.summary}</p>
            </a>
        `).join('');
    }
});
