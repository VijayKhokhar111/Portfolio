// server.js - Backend server for portfolio management

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Project Schema
const projectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    technologies: [{
        type: String,
        required: true
    }],
    demoUrl: String,
    githubUrl: String,
    imageUrl: String,
    category: {
        type: String,
        required: true,
        enum: ['web', 'mobile', 'ai']
    },
    featured: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Contact Schema
const contactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    read: {
        type: Boolean,
        default: false
    }
});

const Project = mongoose.model('Project', projectSchema);
const Contact = mongoose.model('Contact', contactSchema);

// File upload configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/projects/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Email configuration
const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// API Routes

// Get all projects
app.get('/api/projects', async (req, res) => {
    try {
        const { category, featured } = req.query;
        let query = {};
        
        if (category && category !== 'all') {
            query.category = category;
        }
        
        if (featured === 'true') {
            query.featured = true;
        }
        
        const projects = await Project.find(query).sort({ createdAt: -1 });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single project
app.get('/api/projects/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new project
app.post('/api/projects', upload.single('image'), async (req, res) => {
    try {
        const projectData = {
            title: req.body.title,
            description: req.body.description,
            technologies: req.body.technologies.split(',').map(tech => tech.trim()),
            demoUrl: req.body.demoUrl,
            githubUrl: req.body.githubUrl,
            category: req.body.category,
            featured: req.body.featured === 'true'
        };
        
        if (req.file) {
            projectData.imageUrl = `/uploads/projects/${req.file.filename}`;
        }
        
        const project = new Project(projectData);
        await project.save();
        res.status(201).json(project);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update project
app.put('/api/projects/:id', upload.single('image'), async (req, res) => {
    try {
        const updateData = {
            title: req.body.title,
            description: req.body.description,
            technologies: req.body.technologies.split(',').map(tech => tech.trim()),
            demoUrl: req.body.demoUrl,
            githubUrl: req.body.githubUrl,
            category: req.body.category,
            featured: req.body.featured === 'true'
        };
        
        if (req.file) {
            updateData.imageUrl = `/uploads/projects/${req.file.filename}`;
        }
        
        const project = await Project.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json(project);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete project
app.delete('/api/projects/:id', async (req, res) => {
    try {
        const project = await Project.findByIdAndDelete(req.params.id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        // Delete associated image file
        if (project.imageUrl && project.imageUrl.startsWith('/uploads/')) {
            const imagePath = path.join(__dirname, 'public', project.imageUrl);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        
        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Contact form submission
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, message } = req.body;
        
        // Save to database
        const contact = new Contact({ name, email, message });
        await contact.save();
        
        // Send email notification
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
            subject: `New Contact Form Submission from ${name}`,
            html: `
                <h3>New Contact Form Submission</h3>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
                <p><strong>Submitted at:</strong> ${new Date().toLocaleString()}</p>
            `
        };
        
        await transporter.sendMail(mailOptions);
        
        res.status(201).json({ message: 'Message sent successfully' });
    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Get all contact messages
app.get('/api/contacts', async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 });
        res.json(contacts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mark contact as read
app.put('/api/contacts/:id/read', async (req, res) => {
    try {
        const contact = await Contact.findByIdAndUpdate(
            req.params.id,
            { read: true },
            { new: true }
        );
        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }
        res.json(contact);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete contact message
app.delete('/api/contacts/:id', async (req, res) => {
    try {
        const contact = await Contact.findByIdAndDelete(req.params.id);
        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }
        res.json({ message: 'Contact deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Analytics endpoint
app.get('/api/analytics', async (req, res) => {
    try {
        const totalProjects = await Project.countDocuments();
        const totalContacts = await Contact.countDocuments();
        const unreadContacts = await Contact.countDocuments({ read: false });
        const featuredProjects = await Project.countDocuments({ featured: true });
        
        const projectsByCategory = await Project.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);
        
        const recentContacts = await Contact.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('name email createdAt read');
        
        res.json({
            totalProjects,
            totalContacts,
            unreadContacts,
            featuredProjects,
            projectsByCategory,
            recentContacts
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve static files (portfolio website)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Portfolio available at: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    mongoose.connection.close(() => {
        console.log('MongoDB connection closed');
        process.exit(0);
    });
});