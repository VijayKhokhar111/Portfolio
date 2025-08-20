// script.js

// Portfolio Management System
class PortfolioManager {
    constructor() {
        this.projects = this.loadProjects();
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupProjectFilter();
        this.setupAdminPanel();
        this.setupContactForm();
        this.setupAnimations();
        this.renderProjects();
    }

    // Navigation functionality
    setupNavigation() {
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');
        const navLinks = document.querySelectorAll('.nav-link');

        // Mobile menu toggle
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close mobile menu when clicking on a link
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });

        // Active link highlighting
        window.addEventListener('scroll', () => {
            let current = '';
            const sections = document.querySelectorAll('section');
            
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.clientHeight;
                if (window.pageYOffset >= sectionTop - 200) {
                    current = section.getAttribute('id');
                }
            });

            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href').substring(1) === current) {
                    link.classList.add('active');
                }
            });
        });
    }

    // Project filtering
    setupProjectFilter() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons
                filterButtons.forEach(btn => btn.classList.remove('active'));
                // Add active class to clicked button
                button.classList.add('active');
                
                const filter = button.getAttribute('data-filter');
                this.filterProjects(filter);
            });
        });
    }

    filterProjects(category) {
        const projectCards = document.querySelectorAll('.project-card');
        
        projectCards.forEach(card => {
            if (category === 'all' || card.classList.contains(category)) {
                card.style.display = 'block';
                card.classList.add('fade-in-up');
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Admin panel functionality
    setupAdminPanel() {
        const adminToggle = document.getElementById('admin-toggle');
        const adminForm = document.getElementById('admin-form');
        const projectForm = document.getElementById('project-form');

        adminToggle.addEventListener('click', () => {
            adminForm.classList.toggle('hidden');
        });

        projectForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addProject();
        });
    }

    addProject() {
        const formData = {
            title: document.getElementById('project-title').value,
            description: document.getElementById('project-description').value,
            technologies: document.getElementById('project-technologies').value.split(',').map(tech => tech.trim()),
            demoUrl: document.getElementById('project-demo').value,
            githubUrl: document.getElementById('project-github').value,
            imageUrl: document.getElementById('project-image').value || 'https://via.placeholder.com/400x250',
            category: document.getElementById('project-category').value,
            id: Date.now()
        };

        this.projects.push(formData);
        this.saveProjects();
        this.renderProjects();
        this.clearForm();
        
        // Show success message
        this.showNotification('Project added successfully!', 'success');
    }

    clearForm() {
        document.getElementById('project-form').reset();
        document.getElementById('admin-form').classList.add('hidden');
    }

    // Contact form functionality
    setupContactForm() {
        const contactForm = document.querySelector('.contact-form');
        
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleContactSubmission();
        });
    }

    handleContactSubmission() {
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const message = document.getElementById('message').value;

        // In a real application, you would send this data to a server
        console.log('Contact form submitted:', { name, email, message });
        
        // Show success message
        this.showNotification('Message sent successfully!', 'success');
        
        // Clear form
        document.querySelector('.contact-form').reset();
    }

    // Animation setup
    setupAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in-up');
                }
            });
        }, observerOptions);

        // Observe all sections
        document.querySelectorAll('section').forEach(section => {
            observer.observe(section);
        });
    }

    // Project management
    renderProjects() {
        const projectsGrid = document.getElementById('projects-grid');
        projectsGrid.innerHTML = '';

        this.projects.forEach(project => {
            const projectCard = this.createProjectCard(project);
            projectsGrid.appendChild(projectCard);
        });
    }

    createProjectCard(project) {
        const card = document.createElement('div');
        card.className = `project-card ${project.category}`;
        
        card.innerHTML = `
            <img src="${project.imageUrl}" alt="${project.title}" class="project-image">
            <div class="project-content">
                <h3 class="project-title">${project.title}</h3>
                <p class="project-description">${project.description}</p>
                <div class="project-technologies">
                    ${project.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                </div>
                <div class="project-links">
                    ${project.demoUrl ? `<a href="${project.demoUrl}" target="_blank" class="project-link">
                        <i class="fas fa-external-link-alt"></i> Live Demo
                    </a>` : ''}
                    ${project.githubUrl ? `<a href="${project.githubUrl}" target="_blank" class="project-link">
                        <i class="fab fa-github"></i> GitHub
                    </a>` : ''}
                    <button class="project-link delete-btn" onclick="portfolioManager.deleteProject(${project.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;

        return card;
    }

    deleteProject(projectId) {
        if (confirm('Are you sure you want to delete this project?')) {
            this.projects = this.projects.filter(project => project.id !== projectId);
            this.saveProjects();
            this.renderProjects();
            this.showNotification('Project deleted successfully!', 'success');
        }
    }

    // Local storage management
    loadProjects() {
        const saved = localStorage.getItem('portfolio-projects');
        if (saved) {
            return JSON.parse(saved);
        }
        
        // Default projects
        return [
            {
                id: 1,
                title: "Pacman Game",
                description: "A single-player Pac-Man style arcade game implemented in Java using Swing. The game includes tile-based maze rendering, player movement and animation, pellet collection, basic ghost movement, collision detection, and score tracking.",
                technologies: ["Java", "Java", "Java Swing", "Version control / hosting: Git + GitHub"],
                //demoUrl: "https://demo.example.com",
                githubUrl: "https://github.com/VijayKhokhar111/PacMan.git",
                imageUrl: "https://github.com/VijayKhokhar111/PacMan/blob/main/PacMan/Screenshot%202025-08-20%20171143.png",
                category: "Game"
            }
            
            }
        ];
    }

    saveProjects() {
        localStorage.setItem('portfolio-projects', JSON.stringify(this.projects));
    }

    // Utility functions
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Add notification styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : '#3b82f6'};
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out forwards';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Typing effect for hero title
function typeWriter(element, text, speed = 100) {
    let i = 0;
    element.innerHTML = '';
    
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

// Initialize portfolio manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.portfolioManager = new PortfolioManager();
    
    // Add typing effect to hero title
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        const originalText = heroTitle.innerHTML;
        setTimeout(() => {
            typeWriter(heroTitle, originalText, 50);
        }, 500);
    }
});

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .delete-btn {
        background: none !important;
        border: none !important;
        color: #dc2626 !important;
        cursor: pointer;
        padding: 0 !important;
    }
    
    .delete-btn:hover {
        color: #b91c1c !important;
    }
`;
document.head.appendChild(style);
