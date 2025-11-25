import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getProfile, updateProfile } from '../../api/profile';
import './ProfilePage.css';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, refreshProfile } = useAuth();

  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    loadProfile();
  }, [isAuthenticated, navigate]);

  const loadProfile = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await getProfile();
      setProfileData(data);
      setNewUsername(data.username);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        setErrorMessage('Не удалось загрузить профиль. Попробуйте позже.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    setNewUsername(profileData?.username || '');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    if (!newUsername.trim()) {
      setErrorMessage('Имя пользователя не может быть пустым');
      return;
    }

    if (newUsername.length < 3) {
      setErrorMessage('Имя пользователя должно содержать минимум 3 символа');
      return;
    }

    if (newUsername.length > 150) {
      setErrorMessage('Имя пользователя не должно превышать 150 символов');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const updatedData = await updateProfile({ username: newUsername });
      setProfileData(updatedData);
      setIsEditing(false);
      setSuccessMessage('Профиль успешно обновлён');
      await refreshProfile();
    } catch (err) {
      if (err.response?.status === 400) {
        const usernameErrors = err.response.data?.username;
        if (usernameErrors && usernameErrors.length > 0) {
          setErrorMessage(usernameErrors[0]);
        } else {
          setErrorMessage('Ошибка валидации данных');
        }
      } else if (err.response?.status === 401) {
        navigate('/login');
      } else {
        setErrorMessage('Не удалось обновить профиль. Попробуйте позже.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackToChat = () => {
    navigate('/chat');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указана';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="profile-page" data-easytag="id1-src/components/Profile/ProfilePage.jsx">
        <div className="profile-container">
          <div className="profile-loading">
            <div className="profile-spinner"></div>
            <p className="profile-loading-text">Загрузка профиля...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page" data-easytag="id1-src/components/Profile/ProfilePage.jsx">
      <div className="profile-container">
        <div className="profile-header">
          <button className="profile-btn-back" onClick={handleBackToChat}>
            ← Назад к чату
          </button>
          <div className="profile-avatar">
            <span className="profile-avatar-icon">👤</span>
          </div>
          <h1>Профиль</h1>
          <p>Управление вашей учётной записью</p>
        </div>

        <div className="profile-content">
          {successMessage && (
            <div className="profile-message profile-message-success">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="profile-message profile-message-error">
              {errorMessage}
            </div>
          )}

          {!isEditing ? (
            <>
              <div className="profile-info">
                <div className="profile-info-item">
                  <span className="profile-info-label">ID пользователя</span>
                  <span className="profile-info-value">{profileData?.id || '—'}</span>
                </div>
                <div className="profile-info-item">
                  <span className="profile-info-label">Имя пользователя</span>
                  <span className="profile-info-value">{profileData?.username || '—'}</span>
                </div>
              </div>

              <button
                className="profile-btn profile-btn-primary"
                onClick={handleEditToggle}
              >
                Изменить имя пользователя
              </button>
            </>
          ) : (
            <form className="profile-form" onSubmit={handleSaveProfile}>
              <div className="profile-form-group">
                <label htmlFor="username">Новое имя пользователя</label>
                <input
                  type="text"
                  id="username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Введите новое имя"
                  minLength={3}
                  maxLength={150}
                  disabled={isSaving}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="profile-btn profile-btn-primary"
                disabled={isSaving}
              >
                {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
              </button>

              <button
                type="button"
                className="profile-btn profile-btn-secondary"
                onClick={handleEditToggle}
                disabled={isSaving}
              >
                Отмена
              </button>
            </form>
          )}

          <button
            className="profile-btn profile-btn-secondary"
            onClick={handleBackToChat}
          >
            Вернуться к чату
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
