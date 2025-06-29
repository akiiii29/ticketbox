const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!req.user.isAdmin()) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

const requireAdminOrOrganizer = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!req.user.isOrganizer()) {
    return res.status(403).json({ error: 'Organizer or admin access required' });
  }

  next();
};

const requireAdminOrOwner = (resourceOwnerId) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Admin can access anything
    if (req.user.isAdmin()) {
      return next();
    }

    // Check if user is the owner of the resource
    if (req.user.id === parseInt(resourceOwnerId)) {
      return next();
    }

    return res.status(403).json({ error: 'Access denied' });
  };
};

module.exports = {
  requireAdmin,
  requireAdminOrOrganizer,
  requireAdminOrOwner
}; 