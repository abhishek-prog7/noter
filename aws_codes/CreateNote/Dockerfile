FROM public.ecr.aws/lambda/nodejs:18

# Copy package.json and package-lock.json
COPY package.json package-lock.json ${LAMBDA_TASK_ROOT}/

# Install dependencies
RUN npm install

# Copy function code
COPY src/ ${LAMBDA_TASK_ROOT}/

# Set the CMD to your handler
CMD [ "index.handler" ]
