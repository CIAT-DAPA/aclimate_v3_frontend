module.exports = {
  apps: [{
    name: 'aclimate_v3_hn',
    script: 'npm',
    args: 'start',
    cwd: './src',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 8005
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 8005
    },
    out_file: './aclimate_hn_out.log',
    error_file: './aclimate_hn_err.log',
    log_date_format: 'YYYY-MM-DD HH:mm Z'
  }]
}