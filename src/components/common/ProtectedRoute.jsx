import React from 'react';
import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';

const ProtectedRoute = ({ element, allowedRoles }) => {
    const userRole = localStorage.getItem('userRole');

    // If no one is logged in
    if (!userRole) {
        return <Navigate to="/" replace />;
    }

    // If logged in, but role is not allowed
    if (!allowedRoles.includes(userRole)) {
        return <Navigate to="/unauthorized" replace />;
    }

    //All good
    return element;
};

ProtectedRoute.propTypes = {
    element: PropTypes.element.isRequired,
    allowedRoles: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default ProtectedRoute;
