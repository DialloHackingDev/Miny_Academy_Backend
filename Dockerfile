# Étape 1 : Build
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Étape 2 : Production
FROM node:18-alpine

WORKDIR /app

# Créer le dossier uploads
RUN mkdir -p /app/uploads

# Copier les dépendances de l'étape builder avec les bonnes permissions
COPY --from=builder --chown=node:node /app/node_modules ./node_modules

# Copier les fichiers source
COPY --chown=node:node . .

# Utiliser un utilisateur non-root pour la sécurité
USER node

# Exposer le port
EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Lancer le serveur
CMD ["npm", "start"]
